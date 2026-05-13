-- RLS Policies for Academia OS
-- Run this in Supabase SQL Editor (safe to re-run)

-- Enable RLS on all tables (safe if already enabled)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Users
DROP POLICY IF EXISTS "users_select" ON public.users;
DROP POLICY IF EXISTS "users_insert" ON public.users;
DROP POLICY IF EXISTS "users_update" ON public.users;
CREATE POLICY "users_select" ON public.users FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "users_insert" ON public.users FOR INSERT WITH CHECK (auth.uid() = uid);
CREATE POLICY "users_update" ON public.users FOR UPDATE USING (auth.uid() = uid OR auth.role() = 'authenticated');

-- Courses: all authenticated can read; admin can write
DROP POLICY IF EXISTS "courses_select" ON public.courses;
DROP POLICY IF EXISTS "courses_insert" ON public.courses;
DROP POLICY IF EXISTS "courses_update" ON public.courses;
DROP POLICY IF EXISTS "courses_delete" ON public.courses;
CREATE POLICY "courses_select" ON public.courses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "courses_insert" ON public.courses FOR INSERT WITH CHECK (
  (SELECT role FROM public.users WHERE uid = auth.uid()) = 'admin'
);
CREATE POLICY "courses_update" ON public.courses FOR UPDATE USING (
  (SELECT role FROM public.users WHERE uid = auth.uid()) = 'admin'
);
CREATE POLICY "courses_delete" ON public.courses FOR DELETE USING (
  (SELECT role FROM public.users WHERE uid = auth.uid()) = 'admin'
);

-- Branches: all authenticated can read; admin can write
DROP POLICY IF EXISTS "branches_select" ON public.branches;
DROP POLICY IF EXISTS "branches_insert" ON public.branches;
DROP POLICY IF EXISTS "branches_delete" ON public.branches;
CREATE POLICY "branches_select" ON public.branches FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "branches_insert" ON public.branches FOR INSERT WITH CHECK (
  (SELECT role FROM public.users WHERE uid = auth.uid()) = 'admin'
);
CREATE POLICY "branches_delete" ON public.branches FOR DELETE USING (
  (SELECT role FROM public.users WHERE uid = auth.uid()) = 'admin'
);

-- Student profiles
DROP POLICY IF EXISTS "sp_select" ON public.student_profiles;
DROP POLICY IF EXISTS "sp_insert" ON public.student_profiles;
DROP POLICY IF EXISTS "sp_update" ON public.student_profiles;
CREATE POLICY "sp_select" ON public.student_profiles FOR SELECT USING (auth.uid() = uid);
CREATE POLICY "sp_insert" ON public.student_profiles FOR INSERT WITH CHECK (auth.uid() = uid);
CREATE POLICY "sp_update" ON public.student_profiles FOR UPDATE USING (auth.uid() = uid);

-- Contributions
DROP POLICY IF EXISTS "contrib_select" ON public.contributions;
DROP POLICY IF EXISTS "contrib_insert" ON public.contributions;
DROP POLICY IF EXISTS "contrib_update" ON public.contributions;
CREATE POLICY "contrib_select" ON public.contributions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "contrib_insert" ON public.contributions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "contrib_update" ON public.contributions FOR UPDATE USING (auth.role() = 'authenticated');

-- Subjects
DROP POLICY IF EXISTS "subjects_select" ON public.subjects;
DROP POLICY IF EXISTS "subjects_insert" ON public.subjects;
DROP POLICY IF EXISTS "subjects_delete" ON public.subjects;
CREATE POLICY "subjects_select" ON public.subjects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "subjects_insert" ON public.subjects FOR INSERT WITH CHECK (
  (SELECT role FROM public.users WHERE uid = auth.uid()) IN ('admin', 'faculty')
);
CREATE POLICY "subjects_delete" ON public.subjects FOR DELETE USING (
  (SELECT role FROM public.users WHERE uid = auth.uid()) = 'admin'
);

-- Submissions: students manage their own; faculty/admin can read all
DROP POLICY IF EXISTS "submissions_select" ON public.submissions;
DROP POLICY IF EXISTS "submissions_insert" ON public.submissions;
DROP POLICY IF EXISTS "submissions_update" ON public.submissions;
CREATE POLICY "submissions_select" ON public.submissions FOR SELECT USING (
  auth.uid() = "studentId" OR (SELECT role FROM public.users WHERE uid = auth.uid()) IN ('admin', 'faculty')
);
CREATE POLICY "submissions_insert" ON public.submissions FOR INSERT WITH CHECK (auth.uid() = "studentId");
CREATE POLICY "submissions_update" ON public.submissions FOR UPDATE USING (auth.uid() = "studentId");

-- Resources: authenticated can read all; faculty/admin can write
DROP POLICY IF EXISTS "resources_select" ON public.resources;
DROP POLICY IF EXISTS "resources_insert" ON public.resources;
DROP POLICY IF EXISTS "resources_delete" ON public.resources;
CREATE POLICY "resources_select" ON public.resources FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "resources_insert" ON public.resources FOR INSERT WITH CHECK (
  (SELECT role FROM public.users WHERE uid = auth.uid()) IN ('admin', 'faculty')
);
CREATE POLICY "resources_delete" ON public.resources FOR DELETE USING (
  (SELECT role FROM public.users WHERE uid = auth.uid()) IN ('admin', 'faculty')
);
