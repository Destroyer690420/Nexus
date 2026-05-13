-- Academia OS Supabase Schema
-- Run this in Supabase SQL Editor

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
  uid UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'faculty', 'admin')),
  approved BOOLEAN DEFAULT false,
  "createdAt" BIGINT NOT NULL
);

-- Courses table
CREATE TABLE IF NOT EXISTS public.courses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  "hasBranches" BOOLEAN DEFAULT false,
  semesters INTEGER[] NOT NULL
);

-- Branches table
CREATE TABLE IF NOT EXISTS public.branches (
  id TEXT PRIMARY KEY,
  "courseId" TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL
);

-- Student profiles
CREATE TABLE IF NOT EXISTS public.student_profiles (
  uid UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  "courseId" TEXT NOT NULL REFERENCES public.courses(id),
  "branchId" TEXT REFERENCES public.branches(id),
  "semesterId" INTEGER NOT NULL,
  "createdAt" BIGINT NOT NULL
);

-- Contributions
CREATE TABLE IF NOT EXISTS public.contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  "courseId" TEXT NOT NULL,
  "branchId" TEXT DEFAULT NULL,
  "semesterId" INTEGER,
  "subjectId" TEXT DEFAULT '',
  unit INTEGER DEFAULT NULL,
  "fileUrl" TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  "contributedBy" UUID NOT NULL,
  "contributorName" TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  "createdAt" BIGINT NOT NULL,
  "approvedBy" UUID DEFAULT NULL,
  "approvedAt" BIGINT DEFAULT NULL,
  "rejectReason" TEXT DEFAULT ''
);

-- Resources (polymorphic: notes, pyqs, assignments, lab_manuals, others)
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('notes', 'pyqs', 'assignments', 'lab_manuals', 'others')),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  "courseId" TEXT NOT NULL,
  "branchId" TEXT DEFAULT NULL,
  "semesterId" INTEGER,
  "subjectId" TEXT DEFAULT '',
  unit INTEGER DEFAULT NULL,
  "fileUrl" TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  "createdBy" UUID NOT NULL,
  "createdAt" BIGINT NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_branches_course_id ON public.branches("courseId");
CREATE INDEX IF NOT EXISTS idx_contributions_status ON public.contributions(status);
CREATE INDEX IF NOT EXISTS idx_resources_type ON public.resources(type);

-- Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Users: authenticated can read all; insert/update own row
DROP POLICY IF EXISTS "users_select" ON public.users;
DROP POLICY IF EXISTS "users_insert" ON public.users;
DROP POLICY IF EXISTS "users_update" ON public.users;
CREATE POLICY "users_select" ON public.users FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "users_insert" ON public.users FOR INSERT WITH CHECK (auth.uid() = uid);
CREATE POLICY "users_update" ON public.users FOR UPDATE USING (auth.uid() = uid OR auth.role() = 'authenticated');

-- Courses & Branches: authenticated can read all
DROP POLICY IF EXISTS "courses_select" ON public.courses;
CREATE POLICY "courses_select" ON public.courses FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "branches_select" ON public.branches;
CREATE POLICY "branches_select" ON public.branches FOR SELECT USING (auth.role() = 'authenticated');

-- Student profiles: users manage their own
DROP POLICY IF EXISTS "sp_select" ON public.student_profiles;
DROP POLICY IF EXISTS "sp_insert" ON public.student_profiles;
DROP POLICY IF EXISTS "sp_update" ON public.student_profiles;
CREATE POLICY "sp_select" ON public.student_profiles FOR SELECT USING (auth.uid() = uid);
CREATE POLICY "sp_insert" ON public.student_profiles FOR INSERT WITH CHECK (auth.uid() = uid);
CREATE POLICY "sp_update" ON public.student_profiles FOR UPDATE USING (auth.uid() = uid);

-- Contributions: authenticated can read all, insert, update
DROP POLICY IF EXISTS "contrib_select" ON public.contributions;
DROP POLICY IF EXISTS "contrib_insert" ON public.contributions;
DROP POLICY IF EXISTS "contrib_update" ON public.contributions;
CREATE POLICY "contrib_select" ON public.contributions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "contrib_insert" ON public.contributions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "contrib_update" ON public.contributions FOR UPDATE USING (auth.role() = 'authenticated');

-- Resources: authenticated can read all
DROP POLICY IF EXISTS "resources_select" ON public.resources;
CREATE POLICY "resources_select" ON public.resources FOR SELECT USING (auth.role() = 'authenticated');

-- Note: No auto-trigger for user creation.
-- The application creates public.users rows via:
--   - signUpWithEmail() -> creates with chosen role
--   - createUserData() -> creates after Google OAuth role selection
