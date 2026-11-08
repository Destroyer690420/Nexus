-- 006_upload_tickets.sql
-- Rate limiting tracking table for issued upload tickets.
-- Run in the Supabase SQL editor or via db-apply.mjs.

create table if not exists public.upload_tickets (
  id uuid primary key default gen_random_uuid(),
  uid uuid not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_upload_tickets_uid_created on public.upload_tickets (uid, created_at);

alter table public.upload_tickets enable row level security;

revoke all on public.upload_tickets from anon, authenticated;
