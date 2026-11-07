# STATE

## Stack
Next.js 16 App Router, React 19, TypeScript, Tailwind v4. Supabase (auth, Postgres, storage). Vitest. Telegram MTProto storage pipeline in progress under lib/storage + worker.

## Folders
app/(auth) pages; app/dashboard (student/faculty/admin UI); app/api route handlers; components/ui; lib (queries, auth, storage); types; scripts; worker; tests; supabase/migrations; docs.

## Tables
users, courses, branches, student_profiles, subjects, contributions, resources, announcements.
Security: users (own/admin select, own update, admin update, role/approved trigger), contributions (own pending insert, admin update), announcements (authenticated select, admin/faculty write).
Legacy assignments + submissions still exist until 002 runs (exporter first).
storage_objects, storage_jobs, storage_shards added by storage-schema.sql.

## Routes
/auth, /auth/login, /auth/signup, /auth/role, /onboarding, /waitlist.
/dashboard, /dashboard/notes, /pyqs, /assignments, /lab-manuals, /contribute, /my-contributions, /announcements, /search, /upload, /profile, /admin.
API: /api/auth/create-user, /api/admin/{approve,seed}, /api/announcements/{create,delete}, /api/contributions/create + [id]/file, /api/resources/create + [id]/file, /api/files/{token,[objectId]}, /api/search, /api/storage/{drain,health,warm}, /api/upload-url.

## Env
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SITE_URL; ADMIN_SEED_SECRET, ADMIN_SEED_PASSWORD; TELEGRAM_API_ID/HASH/SESSION/STORAGE_CHAT_ID; STORAGE_* (staging, limits, providers, ops/signing secrets).

## Features
Email/Google auth; roles student/faculty/admin; faculty approval; resource browsing by course/branch/semester; student contributions with admin approval queue; announcements; admin panel (faculty, courses, queue, resources, users); authenticated search (Bearer required).
Assignments is a resource type for faculty/admin material only. Students cannot contribute it. Submission, due-date and grading flows removed.

## Open
Run supabase/migrations/002_drop_assignments.sql after exporting data, then 001_security.sql.
Verify RLS coverage with the pg_tables query in 001.
Server route protection via middleware deferred: localStorage sessions are invisible to the server (see DECISIONS D01).
Telegram storage pipeline and worker remain in progress (not covered here).
