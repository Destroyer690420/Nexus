-- 003_guard_sql_editor.sql
-- Allow direct edits in the Supabase SQL editor (session_user postgres / supabase_admin)
-- while preserving the trigger guard for app users.

create or replace function public.guard_user_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Direct database superuser/admin sessions (SQL editor, migrations) bypass.
  if session_user in ('postgres', 'supabase_admin') then
    return new;
  end if;

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

