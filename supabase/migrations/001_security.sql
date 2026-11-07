-- 001_security.sql
-- Idempotent security hardening. Run in the Supabase SQL editor.
-- Do not apply until reviewed; no data migration is performed here.

-- Helper used by policies/trigger (already present in the base schema).
create or replace function public.get_user_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.users where uid = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- 1. users: stop privilege escalation and broad profile reads.
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;

drop policy if exists "users_select" on public.users;
drop policy if exists "users_insert" on public.users;
drop policy if exists "users_update" on public.users;
drop policy if exists "users_update_admin" on public.users;

-- Own row, or admin (admin panel: faculty/users tabs).
create policy "users_select" on public.users
  for select using (auth.uid() = uid or public.get_user_role() = 'admin');

-- A new profile may never be created as admin or pre-approved.
create policy "users_insert" on public.users
  for insert with check (
    auth.uid() = uid
    and role in ('student', 'faculty')
    and approved = false
  );

-- Self-service profile edits only (name/avatar); privilege columns are
-- additionally guarded by the trigger below.
create policy "users_update" on public.users
  for update using (auth.uid() = uid)
  with check (auth.uid() = uid);

-- Admin panel role/approval changes. The trigger still enforces admin.
create policy "users_update_admin" on public.users
  for update using (public.get_user_role() = 'admin')
  with check (public.get_user_role() = 'admin');

create or replace function public.guard_user_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Service-role calls (server routes / admin API) bypass the guard.
  if auth.role() = 'service_role' then
    return new;
  end if;

  if public.get_user_role() = 'admin' then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.approved is distinct from old.approved then
    raise exception 'Only admins may change role or approved'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_user_privileges on public.users;
create trigger guard_user_privileges
  before update on public.users
  for each row execute function public.guard_user_privileges();

-- ---------------------------------------------------------------------------
-- 2. contributions: students may only submit pending, never approve.
-- ---------------------------------------------------------------------------
drop policy if exists "contrib_insert" on public.contributions;
drop policy if exists "contrib_update" on public.contributions;

-- 'assignments' is faculty/admin-only content (resource type retained).
create policy "contrib_insert" on public.contributions
  for insert with check (
    auth.uid() = "contributedBy"
    and status = 'pending'
    and type <> 'assignments'
  );

create policy "contrib_update" on public.contributions
  for update using (public.get_user_role() = 'admin')
  with check (public.get_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- 3. announcements: authenticated read; admin/faculty write.
-- ---------------------------------------------------------------------------
alter table public.announcements enable row level security;

drop policy if exists "announcements_select" on public.announcements;
drop policy if exists "announcements_insert" on public.announcements;
drop policy if exists "announcements_delete" on public.announcements;

create policy "announcements_select" on public.announcements
  for select using (auth.role() = 'authenticated');

create policy "announcements_insert" on public.announcements
  for insert with check (public.get_user_role() in ('admin', 'faculty'));

create policy "announcements_delete" on public.announcements
  for delete using (public.get_user_role() in ('admin', 'faculty'));

-- ---------------------------------------------------------------------------
-- 4. RLS coverage check (run manually after applying):
--
--   select tablename, rowsecurity
--   from pg_tables
--   where schemaname = 'public';
--
-- Every public table that holds user data must show rowsecurity = true.
-- ---------------------------------------------------------------------------
