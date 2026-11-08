# Nexus Behavioral Inventory

This inventory documents all existing routes, role gates, redirect rules, data queries, API calls, validation limits, edge cases, and user-facing copy carrying meaning.

---

## 1. Global & Auth State Rules

### User Roles
- `student`: Default role. Requires a row in `student_profiles(uid, courseId, branchId, semesterId)`. If missing, must be redirected to `/onboarding`.
- `faculty`: Requires admin approval (`users.approved = true`). If `approved = false`, must be redirected to `/waitlist`.
- `admin`: Full access to admin panel (`/dashboard/admin`), all resources, faculty approvals, and courses management.

### Shared Redirect Logic
When an authenticated user's session is detected:
1. Fetch `users` record via `getUserData(userId)`.
2. If record does not exist: redirect to `/auth/role` (to pick role).
3. If `role === 'student'`: query `student_profiles` where `uid = userId`.
   - Profile found -> `/dashboard`
   - Profile missing -> `/onboarding`
4. If `role === 'faculty'`:
   - `approved === true` -> `/dashboard`
   - `approved === false` (or undefined) -> `/waitlist`
5. If `role === 'admin'`:
   - -> `/dashboard`

---

## 2. Route Inventory

### `/` (Root)
- **Role gate**: Public
- **Redirect**: Immediately redirects to `/auth`.
- **Data calls**: None.
- **API calls**: None.

### `/auth` (Landing)
- **Role gate**: Public (unauthenticated). If authenticated, redirects using shared logic above.
- **Redirects**:
  - Authenticated -> `/dashboard`, `/onboarding`, or `/waitlist`
  - "Continue with Email" -> `/auth/login`
- **Data calls**: `supabase.auth.getSession()`, `onAuthChange()`, `getUserData()`.
- **API calls**: `signInWithGoogle()`.
- **Validation**: Google OAuth redirect URL.
- **Copy**:
  - Title: "Nexus"
  - Subtitle: "College resources, simplified."
  - Brief: "Your campus library, in your pocket"
  - Buttons: "Continue with Google", "Continue with Email", "I already have an account"

### `/auth/login` (Login)
- **Role gate**: Public. If authenticated, redirects using shared logic above.
- **Redirects**:
  - Unconfirmed email -> `/auth/verify-email`
  - Success -> redirected via shared redirect logic.
  - No profile -> `/auth/role`
- **Data calls**: `supabase.auth.getSession()`, `onAuthChange()`, `getUserData()`.
- **API calls**: `loginWithEmail(email, password)`, `signInWithGoogle()`.
- **Validation**: Email required, password required.
- **Copy**:
  - Title: "Welcome back"
  - Subtitle: "Sign in to your account"
  - Errors: `getAuthErrorMessage(err)` (e.g. "Invalid email or password.")
  - Links: "Don't have an account? Sign up" -> `/auth/signup`

### `/auth/signup` (Sign Up)
- **Role gate**: Public. If authenticated, redirects using shared logic above.
- **Redirects**:
  - Success -> `/auth/verify-email?email=<email>`
- **Data calls**: `supabase.auth.getSession()`, `onAuthChange()`.
- **API calls**: `signUpWithEmail(email, password, role, name)`, `signInWithGoogle()`.
- **Validation**: Name, email, password (min 6 chars), role in `['student', 'faculty']`.
- **Copy**:
  - Title: "Create your account"
  - Subtitle: "Choose how you'll use Nexus"
  - Role helper: "Faculty accounts require administrator approval before access is granted."
  - Buttons: "Create account", "Continue with Google"
  - Links: "Already have an account? Sign in" -> `/auth/login`

### `/auth/verify-email` (Verify Email)
- **Role gate**: Any user waiting on email confirmation. If confirmed, redirects to dashboard/onboarding.
- **Redirects**:
  - When `user.email_confirmed_at` is present -> shared redirect logic.
- **Data calls**: `supabase.auth.getSession()`, `onAuthChange()`.
- **API calls**: `supabase.auth.resend({ type: 'signup', email })`.
- **Validation**: Email must be provided via query param `?email=...` or active session.
- **Copy**:
  - Title: "Verify your email"
  - Subtitle: "We sent a confirmation link to <email>. Click the link to activate your account."
  - Action: "Resend verification email" (with cooldown)

### `/auth/role` (Role Selection)
- **Role gate**: Authenticated user without a profile in `users`.
- **Redirects**:
  - Unauthenticated -> `/auth`
  - Already has role -> shared redirect logic.
  - Selected `student` -> `/dashboard` if profile exists, else `/onboarding`.
  - Selected `faculty` -> `/waitlist`.
- **Data calls**: `getCurrentUser()`, `getUserData()`.
- **API calls**: `createUserData(uid, email, role)`.
- **Validation**: Role selection required (`student` or `faculty`).
- **Copy**:
  - Title: "Almost there", "Choose your role"
  - Options: "Student", "Faculty"
  - Helper: "Faculty accounts need admin approval"

### `/auth/callback` (OAuth Callback)
- **Role gate**: Handles OAuth redirect from Google.
- **Redirects**:
  - On auth session established -> `/auth/role`
- **Data calls**: `onAuthChange()`.
- **UI**: Full screen loading spinner / Stickie loading state.

### `/onboarding` (Student Profile Setup)
- **Role gate**: Authenticated `student` without `student_profiles` row.
- **Redirects**:
  - Unauthenticated -> `/auth`
  - Profile already exists -> `/dashboard`
- **Data calls**: `supabase.from('courses').select('*')`, `supabase.from('branches').select('*').eq('courseId', courseId)`.
- **API calls / DB writes**: `supabase.from('student_profiles').upsert({ uid, courseId, branchId, semesterId, createdAt })`.
- **Validation**: Course required, semester required, branch required if `course.hasBranches === true`.
- **Copy**:
  - Title: "Set up your profile"
  - Subtitle: "Tell us about your course to personalize your feed"
  - Button: "Start exploring"

### `/waitlist` (Faculty Pending Approval)
- **Role gate**: Authenticated `faculty` with `approved === false` (or unapproved).
- **Redirects**:
  - Unauthenticated -> `/auth`
  - Approved via realtime postgres changes (`users.approved === true`) -> `/dashboard`
- **Data calls**: Realtime subscription on `users` table where `uid = user.id`.
- **Actions**: Sign out (`logout()` -> `/auth`).
- **Copy**:
  - Title: "Pending Approval"
  - Subtitle: "Your account is pending admin approval for <email>. You'll be redirected automatically once approved."

---

## 3. Dashboard Routes

### `/dashboard` (Home)
- **Role gate**: Authenticated users.
  - Student: verifies `student_profiles`. If missing -> `/onboarding`.
  - Faculty: if `!approved` -> `/waitlist`.
- **Data calls**:
  - Student: `getRecentAnnouncementsForStudent(courseId, semesterId, 7)`.
  - Faculty/Admin: `getAnnouncements().slice(0, 3)`.
- **Features**:
  - Greeting: "Hello, {name}" or time-based greeting for faculty/admin.
  - Notice card if recent announcement exists.
  - 4 Category cards: Notes (berry), PYQs (sun), Assignments (tangerine), Lab manuals (fern).
  - Quick action: "Contribute" for students, "Upload" for faculty/admin.

### `/dashboard/notes` (Notes Subjects List)
- **Role gate**: Authenticated.
- **Data calls**:
  - Student: `getSubjects(courseId, branchId, semesterId)`.
  - Faculty/Admin: all subjects ordered by name.
- **Redirects**: Click subject -> `/dashboard/notes/[subjectId]`.

### `/dashboard/notes/[subjectId]` (Notes Units List)
- **Role gate**: Authenticated.
- **Data calls**:
  - Subject info: `subjects.select('name').eq('id', subjectId)`.
  - Resources: `getResourcesBySubject('notes', ...)`.
  - Unique units extracted (unit 0 mapped to "General").
- **Redirects**: Click unit -> `/dashboard/notes/[subjectId]/[unit]`.

### `/dashboard/notes/[subjectId]/[unit]` (Notes Files)
- **Role gate**: Authenticated.
- **Data calls**: `getResourcesBySubject('notes', ...)`, filtered by unit.
- **Actions**: Open file (inline preview) or Download file (attachment) via `openFile(fileId || fileUrl)`.

### `/dashboard/pyqs` (PYQs Subjects List)
- **Role gate**: Authenticated.
- **Data calls**:
  - Student: `getSubjects(courseId, branchId, semesterId)`.
  - Faculty/Admin: all subjects.
- **Redirects**: Click subject -> `/dashboard/pyqs/[subjectId]`.

### `/dashboard/pyqs/[subjectId]` (PYQs Years List)
- **Role gate**: Authenticated.
- **Data calls**: `getResourcesBySubject('pyqs', ...)`.
- **Extraction**: Unique years extracted (year 0 mapped to "Other").
- **Redirects**: Click year -> `/dashboard/pyqs/[subjectId]/[year]`.

### `/dashboard/pyqs/[subjectId]/[year]` (PYQs Files)
- **Role gate**: Authenticated.
- **Data calls**: `getResourcesBySubject('pyqs', ...)`, filtered by year.
- **Actions**: Open and Download via `openFile()`.

### `/dashboard/assignments` (Assignments Material)
- **Role gate**: Authenticated. Faculty/admin-posted materials only. Students cannot submit.
- **Data calls**:
  - Student: `getSubjects(courseId, branchId, semesterId)`.
  - Faculty/Admin: `getResources('assignments')`.
- **Redirects**: Student clicking subject -> `/dashboard/assignments/[subjectId]`.

### `/dashboard/assignments/[subjectId]` (Assignments Subject Files)
- **Role gate**: Authenticated.
- **Data calls**: `getResourcesBySubject('assignments', ...)`.
- **Actions**: Open and Download via `openFile()`.

### `/dashboard/lab-manuals` (Lab Manuals Subjects List)
- **Role gate**: Authenticated.
- **Data calls**:
  - Student: `getSubjects(courseId, branchId, semesterId)`.
  - Faculty/Admin: all subjects.
- **Redirects**: Click subject -> `/dashboard/lab-manuals/[subjectId]`.

### `/dashboard/lab-manuals/[subjectId]` (Lab Manuals Files)
- **Role gate**: Authenticated.
- **Data calls**: `getResourcesBySubject('lab_manuals', ...)`.
- **Actions**: Open and Download via `openFile()`.

### `/dashboard/search` (Search)
- **Role gate**: Authenticated (requires Bearer session token).
- **API calls**: `GET /api/search?q=<query>`.
- **Results**: Grouped into Resources, Subjects, Announcements.
- **Interactions**:
  - Resource card -> `/dashboard/<resourceType>`
  - Announcement card -> `/dashboard/announcements`
  - Empty state with Stickie think and suggestion to contribute.

### `/dashboard/announcements` (Announcements List)
- **Role gate**: Authenticated.
- **Data calls**: `getAnnouncements()`.
- **Actions**:
  - Pinned announcements sorted to top.
  - Faculty/admin can delete via `deleteAnnouncement(id)` (with confirm dialog).
  - Faculty/admin button to create announcement (`/dashboard/announcements/create`).

### `/dashboard/announcements/create` (Create Announcement)
- **Role gate**: Faculty or Admin only. Others redirected to `/dashboard`.
- **API calls**: `POST /api/announcements/create` (Bearer auth).
- **Payload**: `{ title, content, targetRole, pinned }`.
- **Validation**: Title and content required. Target role in `['all', 'student', 'faculty']`.

### `/dashboard/contribute` (Student Resource Contribution)
- **Role gate**: Student only. Faculty/admin redirected to `/dashboard`.
- **Sub-navigation**: Segmented control "New | Mine" (Mine navigates to `/dashboard/my-contributions`).
- **Data calls**: Student profile, course, branch, subjects for course/branch/semester.
- **File Upload Flow**:
  1. `uploadFile(file, onProgress)`: calls `/api/files/ticket` -> uploads streaming to Gateway `POST /upload` -> calls `/api/files/register` -> returns `fileId`.
  2. Submits contribution to `POST /api/contributions/create`.
- **Validation**: Title, subject, file required. If Notes: unit required. If PYQs: at least one year required.
- **Allowed files**: PDF, PNG, JPG, JPEG, WEBP, DOCX, PPTX, XLSX, ZIP. Up to 20 MB.
- **Dedupe handling**: If file is already registered, message says: "This file is already on Nexus. We linked it for you."
- **Celebration**: Stickie cheer celebration on success, then resets form.

### `/dashboard/my-contributions` (Student Contributions Queue)
- **Role gate**: Student only.
- **Data calls**: `getMyContributions(userId)`.
- **Status values**: `pending` (sun), `approved` (fern), `rejected` (crimson).
- **Displays**: Rejection note if present; approval timestamp if approved.

### `/dashboard/upload` (Faculty/Admin Resource Upload)
- **Role gate**: Faculty or Admin only. Students redirected to `/dashboard`.
- **Data calls**: All courses, branches for selected course, subjects for course/branch/semester.
- **File Upload Flow**: Same as contribute, then calls `POST /api/resources/create`.
- **Validation**: Type, course, semester, subject, title, file.

### `/dashboard/profile` (Profile & Settings)
- **Role gate**: Authenticated.
- **Features**:
  - Avatar display with photo upload (client-side resize to 256px, max 2MB, uploaded to Supabase `avatars` bucket).
  - Inline name edit -> `updateUserProfile(uid, { name })`.
  - Student academic details: Course, Branch, Semester update modal -> `student_profiles.update`.
  - Appearance control: SegmentedControl `System | Light | Dark` (persisted in `localStorage` under `theme-preference`).
  - Sign out button with confirm sheet -> `logout()` -> `/auth`.

### `/dashboard/admin` (Admin Panel)
- **Role gate**: Admin only (`userData.role === 'admin'`).
- **Tabs**:
  1. **Overview**: `getAdminStats()` -> counts of users, faculty, students, courses, subjects, resources, pending contributions.
  2. **Faculty**: `getPendingFaculty()` -> approve or reject via `POST /api/admin/approve`.
  3. **Content Queue**: `getPendingContributions()` -> file preview with `useFileLink()`, `approveContribution(id, adminId)` or `rejectContribution(id, reason)`.
  4. **Resources**: `getAllResources()` -> type filter, delete via `deleteResource(id)`.
  5. **Users**: `getAllUsers()` -> search, role updater `updateUserRole(uid, role)`.
  6. **Courses**: CRUD courses (`createCourse`, `deleteCourse`), branches (`createBranch`, `deleteBranch`), subjects (`createSubject`, `deleteSubject`).
