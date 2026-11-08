# Nexus

College resource platform. Share study materials, browse faculty-posted assignments, and stay updated with announcements — all in one place.

## Features

### Students
- Browse notes, PYQs, assignments, and lab manuals organized by course, branch, and semester
- Contribute study materials (requires admin approval before publishing)
- Track your contributions and their approval status
- View course-specific announcements
- Mobile-friendly bottom navigation for quick access

### Faculty
- Upload resources directly (notes, PYQs, assignments, lab manuals)
- Post announcements for students

### Admin
- Approve or reject faculty accounts
- Review and approve student contributions
- Manage courses, branches, semesters, and subjects
- View platform statistics and user management

### General
- Google OAuth and email/password authentication
- Role-based access control (student, faculty, admin)
- Dark, light, and system theme support
- Responsive design for desktop and mobile
- Zero-cost Telegram-backed file gateway with HMAC link signing and Cloudflare Pages edge caching

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Auth & Database:** Supabase (PostgreSQL, RLS)
- **File Storage:** Telegram Bot API via stateless Cloudflare Pages Functions gateway (`nexus-files-7b4c.pages.dev`)
- **Testing:** Vitest

## Getting Started

### Prerequisites

- Node.js 20+
- A Supabase project with migrations applied
- A Cloudflare Pages gateway deployment (see `gateway/`)

### Environment Setup

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# File Gateway & Telegram
LINK_SIGNING_SECRET=your_hmac_signing_secret
FILES_GATEWAY_URL=https://<your-pages-project>.pages.dev
BOT_TOKEN=your_telegram_bot_token
STORAGE_CHANNEL_ID=-100xxxxxxxxxx
BACKUP_CHANNEL_ID=-100yyyyyyyyyy
```

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Verification & Operations

```bash
# Run unit tests
npm test

# Run End-to-End storage verification
node scripts/e2e-storage.mjs

# Backup metadata to Telegram
node scripts/backup-index.mjs

# Dry-run database restore
node scripts/restore-index.mjs --dry-run

# Check for orphaned files
node scripts/orphans-report.mjs
```
