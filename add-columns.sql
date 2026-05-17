-- Academia OS — Schema additions for student redesign
-- Run this in Supabase SQL Editor

-- Add name + avatar to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS name TEXT DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT DEFAULT '';

-- Add year field to resources (for PYQ year categorization)
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS year INTEGER DEFAULT NULL;

-- Add courseId/semesterId to announcements for semester-level targeting
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS "courseId" TEXT DEFAULT NULL;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS "semesterId" INTEGER DEFAULT NULL;
