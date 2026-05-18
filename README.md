# Nexus

College resource and ERP platform. Share study materials, manage assignments, and stay updated with announcements — all in one place.

## Features

### Students
- Browse notes, PYQs, assignments, and lab manuals organized by course, branch, and semester
- Contribute study materials (requires admin approval before publishing)
- Track your contributions and their approval status
- View course-specific announcements
- Mobile-friendly bottom navigation for quick access

### Faculty
- Upload resources directly (notes, PYQs, assignments, lab manuals)
- Create and manage assignments with due dates and late submission settings
- Review and grade student submissions
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
- File uploads to Supabase Storage with signed URLs

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Auth & Database:** Supabase
- **Storage:** Supabase Storage (signed URL uploads)

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project with the schema applied

### Environment Setup

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Setup

Run the SQL files in your Supabase SQL Editor in this order:

1. `supabase-schema.sql` — Creates all tables and initial structure
2. `rls-policies.sql` — Sets up Row Level Security policies
3. `add-columns.sql` — Adds additional columns for student profiles

### Seeding Data

Run the seed script to populate courses, branches, subjects, and an admin user:

```bash
node scripts/seed.mjs
```

Or use the API endpoint (admin only):

```
POST /api/admin/seed
```

## Project Structure

```
app/
  (auth)/          # Authentication pages (login, signup, onboarding)
  dashboard/       # Protected dashboard routes
    admin/         # Admin panel
    announcements/ # Announcement management
    assignments/   # Assignment pages
    contribute/    # Student contribution form
    profile/       # User profile
    upload/        # Faculty upload form
  api/             # API routes
components/
  ui/              # Reusable UI components
  providers/       # React context providers
lib/
  supabase.ts      # Supabase client
  supabase-auth.ts # Authentication helpers
  queries.ts       # Database queries
  upload.ts        # File upload utilities
  theme.ts         # Theme management
types/
  index.ts         # TypeScript type definitions
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## License

Private project.
