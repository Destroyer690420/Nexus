-- 002_drop_assignments.sql
-- Run only after exporting data.
-- Removes the legacy assignments/submissions feature (due dates, submission,
-- grading). The 'assignments' RESOURCE TYPE remains for faculty/admin material.

drop table if exists public.submissions cascade;
drop table if exists public.assignments cascade;
