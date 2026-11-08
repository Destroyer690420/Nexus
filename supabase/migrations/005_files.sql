-- 005_files.sql
-- Telegram-backed file gateway metadata table and foreign keys.
-- Run in the Supabase SQL editor or via db-apply.mjs.

create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  tg_file_id text not null,
  tg_message_id bigint not null,
  sha256 text not null,
  size_bytes integer not null,
  mime text not null,
  original_name text not null,
  uploaded_by uuid references public.users(uid) on delete set null,
  created_at timestamptz not null default now(),
  constraint files_sha256_size_unique unique (sha256, size_bytes)
);

create index if not exists idx_files_sha256_size on public.files (sha256, size_bytes);
create index if not exists idx_files_uploaded_by on public.files (uploaded_by);

-- Link resources and contributions to files (nullable for legacy compatibility)
alter table public.resources
  add column if not exists "fileId" uuid references public.files(id) on delete set null;

alter table public.contributions
  add column if not exists "fileId" uuid references public.files(id) on delete set null;

create index if not exists idx_resources_file_id on public.resources ("fileId");
create index if not exists idx_contributions_file_id on public.contributions ("fileId");

-- RLS & Column security
-- tg_file_id and tg_message_id must NEVER be readable by client sessions.
alter table public.files enable row level security;

revoke all on public.files from anon, authenticated;

grant select (id, mime, size_bytes, original_name, uploaded_by, created_at)
  on public.files to authenticated;

drop policy if exists "files_select" on public.files;
create policy "files_select" on public.files
  for select to authenticated
  using (true);

