-- 002_drop_assignments.sql
-- Run only after exporting data.
-- Removes the legacy assignments/submissions feature (due dates, submission,
-- grading). The 'assignments' RESOURCE TYPE remains for faculty/admin material.

drop policy if exists "submissions_select" on public.submissions;
drop policy if exists "submissions_insert" on public.submissions;
drop policy if exists "submissions_update" on public.submissions;

drop policy if exists "assignments_select" on public.assignments;
drop policy if exists "assignments_insert" on public.assignments;
drop policy if exists "assignments_update" on public.assignments;
drop policy if exists "assignments_delete" on public.assignments;

drop table if exists public.submissions cascade;
drop table if exists public.assignments cascade;
