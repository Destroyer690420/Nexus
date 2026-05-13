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

-- Auto-create public.users row on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (uid, email, role, "createdAt")
  VALUES (
    NEW.id,
    NEW.email,
    'student',
    EXTRACT(EPOCH FROM NOW()) * 1000
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
