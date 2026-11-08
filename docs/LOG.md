N-001 | 2026-11-08 | [REFACTOR] | app/dashboard/assignments, app/api/{assignments,submissions,search}, lib/queries.ts, types/index.ts, supabase/migrations/002 | Removed assignment submission/grading flow; kept assignments resource type for faculty/admin material | undo: revert commit and restore migration backup
N-002 | 2026-11-08 | [SEC] | supabase/migrations/001_security.sql, app/api/search, components/ui/SearchBar.tsx, lib/supabase-auth.ts, app/api/{resources,contributions}/[id]/file | Locked users/contributions/announcements RLS, added privilege trigger, authenticated+escaped search; API audit: only seed/storage secret routes and signed-file endpoints are non-Bearer by design
N-003 | 2026-11-08 | [DOC] | docs/STATE.md, fix-subjectid-migration.sql | Finalized state from code; removed obsolete assignments repair SQL; migrations pending human run
N-004 | 2026-11-08 | [DOC] | AGENTS.md | Added mandatory push-to-origin rule after every change set
N-005 | 2026-11-08 | [FEAT] | gateway/, tsconfig.json, eslint.config.mjs | Created and deployed Cloudflare Pages file gateway skeleton with functional cache verification | undo: npx wrangler pages project delete nexus-files-7b4c
N-006 | 2026-11-08 | [FIX] | supabase/migrations/002_drop_assignments.sql | Removed redundant drop policy statements that threw 42P01 when tables do not exist | undo: git revert HEAD
N-007 | 2026-11-08 | [DOC] | docs/LOG.md | Verified direct Telegram Bot API storage channel send, getFile, download SHA-256, 20MB limit and deleteMessage
N-008 | 2026-11-08 | [FEAT] | gateway/ | Implemented stateless Telegram file gateway with HMAC tokens, streaming upload, synthetic cache, and selftests | undo: git revert HEAD
N-009 | 2026-11-08 | [FEAT] | gateway/functions/upload.js, gateway/scripts/selftest.mjs | Deployed gateway to Cloudflare Pages and verified all 8 end-to-end integration checks | undo: git revert HEAD
N-010 | 2026-11-08 | [FEAT] | gateway/wrangler.toml | Added https://nexxuus.vercel.app to ALLOWED_ORIGINS and redeployed gateway to Cloudflare Pages | undo: git revert HEAD
N-011 | 2026-11-08 | [REFACTOR] | app/, lib/, package.json, supabase/migrations/ | Reconciled repo, removed MTProto storage pipeline, added migrations 003 and 004 | undo: git revert HEAD
N-012 | 2026-11-08 | [DB] | supabase/migrations/005_files.sql | Added files table, RLS column grants, and foreign keys on resources and contributions | undo: drop table files cascade
N-013 | 2026-11-08 | [FEAT] | lib/files-signing.ts, app/api/files/, tests/ | Added file token signing, ticket/register/link endpoints, tests, and updated resource creation | undo: git revert HEAD
N-014 | 2026-11-08 | [FEAT] | lib/upload.ts, lib/file-client.ts, components/ui/PDFGrid.tsx, app/dashboard/ | Wired client upload to gateway with progress and fileId preview/download | undo: git revert HEAD
N-015 | 2026-11-08 | [FEAT] | scripts/e2e-storage.mjs | Created and ran end-to-end storage verification suite; 10/10 checks passed | undo: git revert HEAD
N-016 | 2026-11-08 | [FEAT] | scripts/, .github/workflows/ | Added keepalive and backup workflows, index backup/restore, migration, and orphans scripts | undo: git revert HEAD
N-017 | 2026-11-08 | [DOC] | README.md, docs/DECISIONS.md, scripts/ | Documented architecture and decisions D10-D14, verified full test and e2e suite | undo: git revert HEAD
N-018 | 2026-11-08 | [FIX] | supabase/migrations/002_drop_assignments.sql | Removed redundant drop policy statements causing 42P01 on missing tables | undo: git revert HEAD
N-019 | 2026-11-08 | [DOC] | docs/STATE.md | Noted migrations 001-005 applied and completed migration of 12 legacy files to Telegram | undo: git revert HEAD
N-020 | 2026-11-08 | [FEAT] | package.json, app/layout.tsx | Added @vercel/analytics package and Analytics component to root layout | undo: git revert HEAD
N-021 | 2026-11-08 | [FIX] | app/api/files/register/route.ts, tests/files-register.test.ts | Changed file registration to insert-only; preserves existing rows on unique violation | undo: git revert HEAD
