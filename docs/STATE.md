# STATE

## Stack
Next.js 16 App Router, React 19, TypeScript, Tailwind v4. Supabase (auth, Postgres, storage). @vercel/analytics. Vitest. Stateless Cloudflare Pages file gateway (nexus-files-7b4c).

## Folders
gateway (lib, functions, scripts, public); app/(auth) pages; app/dashboard (student/faculty/admin UI); app/api route handlers; components/ui; lib (queries, auth); types; scripts; tests; supabase/migrations; docs; .github/workflows.

## Tables
users, courses, branches, student_profiles, subjects, contributions, resources, announcements, files, upload_tickets.
Security: users (own/admin select, own update, admin update, role/approved trigger), contributions (own pending insert, admin update), announcements (authenticated select, admin/faculty write).
files: authenticated select non-secret columns only; tg_* columns restricted to service role; dedupe on (sha256, size_bytes).
upload_tickets: tracks daily ticket issuance for rate limits (RLS service role only).
resources and contributions have nullable "fileId" referencing files(id).
Legacy assignments + submissions dropped via 002. Legacy storage objects dropped via 004.

## Routes
Gateway: POST /upload, GET /f/[token].
App: /auth, /auth/login, /auth/signup, /auth/role, /onboarding, /waitlist.
/dashboard, /dashboard/notes, /pyqs, /assignments, /lab-manuals, /contribute, /my-contributions, /announcements, /search, /upload, /profile, /admin.
API: /api/auth/create-user, /api/admin/{approve,seed}, /api/announcements/{create,delete}, /api/contributions/create, /api/resources/create, /api/files/{ticket,register,link}, /api/search.

## Env
Cloudflare Pages (nexus-files-7b4c.pages.dev): BOT_TOKEN, STORAGE_CHANNEL_ID, LINK_SIGNING_SECRET, ALLOWED_ORIGINS; unused: SUPABASE_URL, SUPABASE_ANON_KEY.
App: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SITE_URL; ADMIN_SEED_SECRET, ADMIN_SEED_PASSWORD; LINK_SIGNING_SECRET, FILES_GATEWAY_URL, BOT_TOKEN, STORAGE_CHANNEL_ID, BACKUP_CHANNEL_ID.

## Features
Email/Google auth; roles student/faculty/admin; faculty approval; resource browsing by course/branch/semester; student contributions with admin approval queue; announcements; admin panel (faculty, courses, queue, resources, users); authenticated search (Bearer required).
Client upload via signed gateway tickets with XHR progress reporting; preview and download supporting both fileId and legacy fileUrl.
E2E verified: 10/10 checks passed on deployed Cloudflare Pages gateway (upload, auth, limits, cache, cleanup).
Assignments is a resource type for faculty/admin material only. Students cannot contribute it. Submission, due-date and grading flows removed.

## Open
Migrations 001 through 005 applied in production Supabase database; 006_upload_tickets.sql pending run.
Legacy study materials migrated to Telegram file gateway (12 files registered; 0 orphans).
Server route protection via middleware deferred: localStorage sessions are invisible to the server (see DECISIONS D01).
