-- ============================================================================
-- Nexus Storage Migration — Phase 5 schema
-- Apply in Supabase SQL Editor AFTER supabase-schema.sql / rls-policies.sql /
-- add-columns.sql. Entirely ADDITIVE: no existing column or row is modified.
--
-- Design notes:
-- * Telegram-specific metadata lives ONLY in storage_object_locations.tg_meta
--   (jsonb). The rest of Nexus depends on storage_objects + the provider
--   abstraction, never on Telegram internals.
-- * tg_meta.file_reference is REFRESHABLE CACHE DATA (expires). Durable
--   identity = (chat_id, message_id, document_id, access_hash).
-- * All new tables are DENIED to anon/authenticated roles (service-role only)
--   so no provider metadata can leak through PostgREST.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Storage shards: one logical Telegram destination (channel) per row.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.storage_shards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL DEFAULT 'telegram',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'disabled', 'retired')),
  -- { "chatId": "-100...", "accountId": "primary" } — NO secrets here.
  config JSONB NOT NULL,
  -- Name of the env var holding this shard's TELEGRAM_SESSION, e.g.
  -- "TELEGRAM_SESSION_SHARD_2". The secret itself never enters the DB.
  session_env_var TEXT NOT NULL DEFAULT 'TELEGRAM_SESSION',
  max_concurrency INTEGER NOT NULL DEFAULT 3,
  -- Circuit breaker + health snapshot (updated by workers):
  -- { "state": "closed|open|half_open", "openedAt": ..., "failureCount": n,
  --   "lastError": "...", "lastSuccessAt": ... }
  health JSONB NOT NULL DEFAULT '{}',
  "createdAt" BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM now()) * 1000)::BIGINT,
  "updatedAt" BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM now()) * 1000)::BIGINT
);

-- ---------------------------------------------------------------------------
-- Physical objects: provider-neutral content identity + dedup anchor.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.storage_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'telegram',
  object_key TEXT NOT NULL UNIQUE,
  size BIGINT NOT NULL CHECK (size >= 0),
  mime_type TEXT,
  sha256 TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'uploading', 'verifying', 'ready', 'degraded', 'quarantined', 'failed', 'deleted')),
  ref_count INTEGER NOT NULL DEFAULT 0,
  "createdAt" BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM now()) * 1000)::BIGINT,
  "updatedAt" BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM now()) * 1000)::BIGINT
);

CREATE INDEX IF NOT EXISTS idx_storage_objects_sha ON public.storage_objects(sha256, size);
CREATE INDEX IF NOT EXISTS idx_storage_objects_status ON public.storage_objects(status);

-- ---------------------------------------------------------------------------
-- Locations: where a physical object physically lives (per shard).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.storage_object_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id UUID NOT NULL REFERENCES public.storage_objects(id) ON DELETE CASCADE,
  shard_id UUID NOT NULL REFERENCES public.storage_shards(id),
  state TEXT NOT NULL DEFAULT 'active'
    CHECK (state IN ('active', 'migrating', 'unavailable', 'retired')),
  -- Provider-specific durable metadata:
  -- { "chatId": "...", "messageId": 123, "documentId": "...",
  --   "accessHash": "...", "fileReferenceB64": "...", "dcId": 2 }
  tg_meta JSONB NOT NULL,
  "createdAt" BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM now()) * 1000)::BIGINT,
  "updatedAt" BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM now()) * 1000)::BIGINT,
  UNIQUE (object_id, shard_id)
);

CREATE INDEX IF NOT EXISTS idx_locations_shard ON public.storage_object_locations(shard_id);

-- ---------------------------------------------------------------------------
-- Jobs: PostgreSQL-backed queue with leases (SKIP LOCKED claiming).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.storage_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL
    CHECK (type IN ('upload_to_telegram', 'verify_object', 'delete_object', 'migrate_object', 'refresh_reference')),
  payload JSONB NOT NULL,
  -- Idempotency: the same logical operation maps to one job.
  idempotency_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'retrying', 'done', 'dead', 'cancelled')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  locked_by TEXT,
  locked_until BIGINT,          -- epoch ms lease expiry
  next_attempt_at BIGINT NOT NULL DEFAULT 0,  -- epoch ms; 0 = immediately runnable
  last_error TEXT,
  progress JSONB NOT NULL DEFAULT '{}',
  heartbeat_at BIGINT,
  "createdAt" BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM now()) * 1000)::BIGINT,
  "updatedAt" BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM now()) * 1000)::BIGINT
);

-- Claim query support: runnable jobs first.
CREATE INDEX IF NOT EXISTS idx_jobs_claim ON public.storage_jobs(status, next_attempt_at);
CREATE INDEX IF NOT EXISTS idx_jobs_lease ON public.storage_jobs(locked_until);

-- ---------------------------------------------------------------------------
-- Link content tables to physical objects (nullable during migration;
-- fileUrl columns remain until Phase 13 cutover completes).
-- ---------------------------------------------------------------------------
ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS "storageObjectId" UUID REFERENCES public.storage_objects(id);
ALTER TABLE public.contributions
  ADD COLUMN IF NOT EXISTS "storageObjectId" UUID REFERENCES public.storage_objects(id);

CREATE INDEX IF NOT EXISTS idx_resources_storage_object ON public.resources("storageObjectId");
CREATE INDEX IF NOT EXISTS idx_contributions_storage_object ON public.contributions("storageObjectId");

-- ---------------------------------------------------------------------------
-- Atomic queue operations (service-role only; called via PostgREST rpc).
-- ---------------------------------------------------------------------------

-- Atomically claim runnable jobs. FOR UPDATE SKIP LOCKED guarantees that N
-- concurrent workers never receive the same job.
CREATE OR REPLACE FUNCTION public.claim_storage_jobs(
  p_worker TEXT,
  p_limit INTEGER DEFAULT 5,
  p_lease_ms BIGINT DEFAULT 240000
)
RETURNS SETOF public.storage_jobs
LANGUAGE sql VOLATILE AS $$
  WITH picked AS (
    SELECT id FROM public.storage_jobs
     WHERE status IN ('queued', 'retrying')
       AND next_attempt_at <= (EXTRACT(EPOCH FROM now()) * 1000)::BIGINT
     ORDER BY next_attempt_at ASC, "createdAt" ASC
     LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 5), 50))
     FOR UPDATE SKIP LOCKED
  )
  UPDATE public.storage_jobs j
     SET status = 'running',
         locked_by = p_worker,
         locked_until = (EXTRACT(EPOCH FROM now()) * 1000)::BIGINT + COALESCE(p_lease_ms, 240000),
         attempts = attempts + 1,
         heartbeat_at = (EXTRACT(EPOCH FROM now()) * 1000)::BIGINT,
         "updatedAt" = (EXTRACT(EPOCH FROM now()) * 1000)::BIGINT
   WHERE j.id IN (SELECT id FROM picked)
   RETURNING j.*;
$$;

-- Recover jobs whose worker died mid-flight (lease expired).
CREATE OR REPLACE FUNCTION public.reap_stale_jobs()
RETURNS INTEGER LANGUAGE plpgsql VOLATILE AS $$
DECLARE recovered INTEGER;
BEGIN
  UPDATE public.storage_jobs
     SET status = CASE WHEN attempts >= max_attempts THEN 'dead' ELSE 'retrying' END,
         locked_by = NULL,
         locked_until = NULL,
         last_error = COALESCE(last_error, '') || ' | lease expired',
         "updatedAt" = (EXTRACT(EPOCH FROM now()) * 1000)::BIGINT
   WHERE status = 'running'
     AND locked_until IS NOT NULL
     AND locked_until < (EXTRACT(EPOCH FROM now()) * 1000)::BIGINT;
  GET DIAGNOSTICS recovered = ROW_COUNT;
  RETURN recovered;
END;
$$;

-- Queue depth snapshot for observability endpoints.
CREATE OR REPLACE FUNCTION public.storage_queue_stats()
RETURNS TABLE(status TEXT, count BIGINT, oldest_age_ms BIGINT)
LANGUAGE sql STABLE AS $$
  SELECT status::TEXT, COUNT(*)::BIGINT,
         COALESCE(MIN((EXTRACT(EPOCH FROM now()) * 1000)::BIGINT - "createdAt"), 0)::BIGINT
    FROM public.storage_jobs
   GROUP BY status;
$$;

-- ---------------------------------------------------------------------------
-- Lockdown: these tables are service-role ONLY. No anon/authenticated policy
-- is created, and RLS is enabled, so PostgREST returns empty/denied for all
-- non-service callers.
-- ---------------------------------------------------------------------------
ALTER TABLE public.storage_shards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_object_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_jobs ENABLE ROW LEVEL SECURITY;

-- Explicit deny (defense in depth; default-deny already applies when no
-- policy exists, but make intent unambiguous for auditors).
DROP POLICY IF EXISTS deny_anon_storage_shards ON public.storage_shards;
CREATE POLICY deny_anon_storage_shards ON public.storage_shards
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
DROP POLICY IF EXISTS deny_anon_storage_objects ON public.storage_objects;
CREATE POLICY deny_anon_storage_objects ON public.storage_objects
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
DROP POLICY IF EXISTS deny_anon_storage_locations ON public.storage_object_locations;
CREATE POLICY deny_anon_storage_locations ON public.storage_object_locations
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
DROP POLICY IF EXISTS deny_anon_storage_jobs ON public.storage_jobs;
CREATE POLICY deny_anon_storage_jobs ON public.storage_jobs
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

-- ---------------------------------------------------------------------------
-- Atomic ref_count maintenance helpers (used by application code paths).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_object_ref(p_object_id UUID)
RETURNS void LANGUAGE sql AS $$
  UPDATE public.storage_objects
     SET ref_count = ref_count + 1, "updatedAt" = (EXTRACT(EPOCH FROM now()) * 1000)::BIGINT
   WHERE id = p_object_id;
$$;

CREATE OR REPLACE FUNCTION public.decrement_object_ref(p_object_id UUID)
RETURNS void LANGUAGE sql AS $$
  UPDATE public.storage_objects
     SET ref_count = GREATEST(0, ref_count - 1),
         "updatedAt" = (EXTRACT(EPOCH FROM now()) * 1000)::BIGINT
   WHERE id = p_object_id;
$$;
