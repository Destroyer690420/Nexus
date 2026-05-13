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

-- Courses
DROP POLICY IF EXISTS "courses_select" ON public.courses;
CREATE POLICY "courses_select" ON public.courses FOR SELECT USING (auth.role() = 'authenticated');

-- Branches
DROP POLICY IF EXISTS "branches_select" ON public.branches;
CREATE POLICY "branches_select" ON public.branches FOR SELECT USING (auth.role() = 'authenticated');

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

-- Resources
DROP POLICY IF EXISTS "resources_select" ON public.resources;
CREATE POLICY "resources_select" ON public.resources FOR SELECT USING (auth.role() = 'authenticated');
