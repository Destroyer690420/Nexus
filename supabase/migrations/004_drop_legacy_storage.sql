-- 004_drop_legacy_storage.sql
-- Guard against data loss: abort if any non-null storageObjectId exists.
-- Drop abandoned MTProto storage tables and references.

do $$
declare
  r_count integer := 0;
  c_count integer := 0;
begin
  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'resources' and column_name = 'storageObjectId'
  ) then
    execute 'select count(*) from public.resources where "storageObjectId" is not null' into r_count;
  end if;

  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'contributions' and column_name = 'storageObjectId'
  ) then
    execute 'select count(*) from public.contributions where "storageObjectId" is not null' into c_count;
  end if;

  if r_count > 0 or c_count > 0 then
    raise exception 'Cannot drop storageObjectId: % resources and % contributions have non-null storageObjectId', r_count, c_count;
  end if;
end;
$$;

drop table if exists public.storage_shards cascade;
drop table if exists public.storage_jobs cascade;
drop table if exists public.storage_objects cascade;

alter table public.resources drop column if exists "storageObjectId";
alter table public.contributions drop column if exists "storageObjectId";

