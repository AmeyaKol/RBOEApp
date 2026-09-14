# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**RBOE (Rohan's Best Outcomes for Education)** is a Next.js full-stack graduate admissions guidance platform. It is a role-based application serving students preparing graduate school applications and administrators managing those students' progress. (Older docs/config — SETUP.md, `sql/schema.sql`, `.env.example` — call it "Project Constellation"; same project.)

**Tech Stack:**
- **Frontend:** Next.js 15.4.4, React 19, TypeScript 5
- **Styling:** Tailwind CSS 4, shadcn/ui components (new-york style)
- **Backend:** Next.js API Routes (serverless functions)
- **Database:** PostgreSQL (Supabase). Accessed exclusively through the Supabase JS client (`@supabase/supabase-js` + `@supabase/auth-helpers-nextjs`). Prisma is installed and `prisma/schema.prisma` exists, but it has **no models** and is not used anywhere in the app — ignore it unless deliberately introducing Prisma.
- **Authentication:** Supabase Auth (email/password) only. There is **no NextAuth** despite `NEXTAUTH_*` vars in `.env.example`.
- **State Management:** Zustand 5.0.6
- **Forms:** React Hook Form 7.61.1, Zod 4.0.10 (validation)
- **UI Utilities:** Radix UI, Lucide React icons, Framer Motion animations
- **Build Tool:** Turbopack (dev), standard Next.js build (production)

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Development server on port 3001 (Turbopack)
npm run build        # Production build
npm start            # Start production server
npm run lint         # ESLint + Next.js rules
```

**Note:** The project has known lint/type issues that prevent `npm run build` from completing cleanly. See BETA_READINESS_REPORT.md.

## Architecture Overview

### Directory Structure

```
src/
├── middleware.ts                 # Route protection + role-based access control (see below)
├── app/                          # Next.js App Router
│   ├── page.tsx                 # Public marketing landing page
│   ├── (auth)/                  # Auth route group: login, register
│   ├── (platform)/              # Protected routes group (has its own layout.tsx with Header)
│   │   ├── admin/               # alumni-outreach, dashboard, onboarding, requests, students, university-research
│   │   └── student/             # applications, dashboard, documents, requests
│   ├── api/                     # API routes (serverless endpoints)
│   │   ├── admin/               # dashboard, requests, requests/[id], students, students/[userId]
│   │   ├── student/             # profile, applications(+/[id]), documents(+/[id], /[id]/comments), requests
│   │   └── auth/confirm-user/   # admin-side email confirmation helper
│   └── layout.tsx               # Root layout with fonts & ClientAuthProvider
├── components/
│   ├── ui/                      # shadcn/ui components (Card, Button, Badge, etc.)
│   ├── features/                # AddApplicationModal, AdminResponseModal, EditProfileModal
│   ├── layout/                  # Layout components (Header, Hero, Footer)
│   ├── shell/                   # PageShell, PageHeader wrappers
│   ├── auth/                    # Auth-related components
│   └── providers/               # ClientAuthProvider wrapper
├── hooks/
│   └── useAuth.tsx              # Main auth context hook (user, loading, refreshProfile)
├── lib/
│   ├── auth.ts                  # Auth utilities (sign up/sign in, profile CRUD, role helpers)
│   ├── supabase.ts              # Client-side Supabase client + hand-written `Database` type
│   ├── utils.ts                 # `cn()` and misc helpers
│   └── view-models/             # API-shape → ViewModel mappers (application.ts, document.ts, request.ts)
└── app/globals.css              # Global Tailwind CSS

sql/schema.sql                   # The real DB schema (run manually in the Supabase SQL editor)
skills/FrontendDesignSkill.md    # In-repo design guidance for building distinctive UI
```

### Authentication & User Context

Auth is enforced in **two independent layers** — keep both in mind when changing access rules:

**1. `src/middleware.ts` (server, runs on every non-asset request):**
- Reads the Supabase session via `createMiddlewareClient`.
- Unauthenticated + path under `/student` or `/admin` → redirect to `/login?redirectTo=...`.
- Authenticated + on `/login` or `/register` → redirect to the role's dashboard.
- Role gate: `STUDENT` hitting `/admin/*` → redirected to `/student/dashboard`; `ADMIN` may access both trees. Role is read fresh from the `profiles` table on each request.
- `matcher` excludes `/api`, `_next`, and image files, so **API routes do their own auth checks** (see API Route Pattern).

**2. Client context (`useAuth.tsx`):**
1. `ClientAuthProvider` (root layout) wraps the app with `AuthProvider`.
2. `AuthProvider` exposes `user` (`AuthUser | null`), `loading`, `refreshProfile()`.
3. Subscribes to Supabase client-side auth listeners; on change, loads the profile from `profiles` via `getUserProfile()`.
4. Components read it via the `useAuth()` hook.

**Key functions in `lib/auth.ts`:**
- `getUserProfile(userId)` — fetch profile; creates a default `STUDENT` profile if none exists
- `createUserProfile` / `updateUserProfile` — profile writes
- `signUpWithPassword(email, password, role, fullName)` / `signInWithPassword(email, password)` / `signOut()`
- `hasRole(user, role)` / `isStudent(user)` / `isAdmin(user)` — client-side role checks
- `getDashboardRoute(role)` — STUDENT → `/student/dashboard`, ADMIN → `/admin/dashboard`

**User Roles:** `'STUDENT' | 'ADMIN'` (`UserRole` type). The `profiles` row is created automatically by the `on_auth_user_created` Postgres trigger (`handle_new_user`), reading `role`/`full_name` from signup metadata.

### API Route Pattern

All API routes follow this pattern:
1. `const supabase = createRouteHandlerClient({ cookies })`
2. `const { data: { user } } = await supabase.auth.getUser()` → return 401 if absent
3. Query/mutate Supabase tables (RLS in `sql/schema.sql` is the real authorization boundary — most routes do **not** re-check the role in code, they rely on RLS)
4. Return `NextResponse.json(data)` or `NextResponse.json({ error }, { status })`
5. Wrap the body in `try/catch` and `console.error` on failure

Example endpoints: `/api/student/profile` (GET/PUT), `/api/student/applications` (GET/POST), `/api/admin/students/[userId]` (GET/PUT).

**Note:** Some list pages fall back to inline sample arrays when the API call fails or returns empty, so a mutation can succeed while the visible list still shows placeholder rows — see KNOWN_GAPS.md and BETA_READINESS_REPORT.md.

### View Models & Data Mapping

Located in `src/lib/view-models/`, these files map API response shapes to consistent ViewModels:
- `application.ts` — Maps API response (snake_case) → `ApplicationViewModel` (camelCase)
- `document.ts` — Similar mapping for documents
- `request.ts` — Similar mapping for requests

This decouples components from raw API shapes and enables type-safe transformations.

### Layout Hierarchy

**Route Groups** (parentheses in route names don't affect URL):
- `(auth)` — Public auth pages (login, register); two-column split layout
- `(platform)` — Protected pages; includes Header and main layout wrapper
  - `admin/` — dashboard, students, requests, onboarding, university-research, alumni-outreach
  - `student/` — dashboard, applications, documents, requests

Each group has its own `layout.tsx` wrapping pages with shared UI.

### Component Organization

- **UI Components** (`components/ui/`) — Pure presentational shadcn/ui exports
- **Features** (`components/features/`) — Business logic components (EditProfileModal, ApplicationForm, etc.)
- **Layout** (`components/layout/`) — Page-level layout sections (Hero, Services, Testimonials, BookingForm, Footer)
- **Shell** (`components/shell/`) — Reusable page containers (PageShell, PageHeader)

### Form Validation

Uses **Zod** schemas for runtime validation + **React Hook Form** for state management:
- Schemas defined near components that use them
- `resolver: zodResolver(schema)` in `useForm()`
- Type-safe via `z.infer<typeof schema>`

### Styling

- **Tailwind CSS 4** with PostCSS plugin (`@tailwindcss/postcss`)
- **CSS Variables** for theming (dark/light mode ready)
- **Class Variance Authority (CVA)** for component variants (shadcn/ui pattern)
- **Framer Motion** for animations (smooth transitions, micro-interactions)

### State Management

- **Zustand** for global state (minimal in current codebase; mostly component-level `useState`)
- **React Context** for auth state (see `AuthProvider` in `useAuth.tsx`)

## Configuration Files

- **tsconfig.json** — Strict mode, path alias `@/*` → `./src/*`
- **next.config.ts** — Minimal; inherits defaults
- **.env.example / .env** — Supabase URL + anon/service-role keys, `DATABASE_URL`, `OPENAI_API_KEY`, unused `NEXTAUTH_*`. ⚠️ Both files currently contain **real-looking credentials** committed to the repo — do not echo their contents into shared output, and treat rotating them as a separate task if asked.
- **components.json** — shadcn/ui config (new-york style, `slate` base color); aliases for components, ui, utils, hooks, lib
- **eslint.config.mjs** — Extends `next/core-web-vitals` and `next/typescript` (flat config via `FlatCompat`)
- **postcss.config.mjs** — Tailwind CSS 4 with `@tailwindcss/postcss`

## Database

The source of truth is **`sql/schema.sql`**, applied by hand in the Supabase SQL editor (no migration tool, no Prisma models). It defines:

- **Enums:** `user_role` (STUDENT, ADMIN), `application_status` (RESEARCHING, APPLYING, APPLIED, ACCEPTED, REJECTED, WAITLISTED), `document_type` (SOP, LOR, RESUME, TRANSCRIPT), `request_status` (OPEN, IN_PROGRESS, CLOSED)
- **Tables:** `profiles` (1:1 with `auth.users`, holds `role` + academic stats), `documents` (versioned SOP/LOR/etc., `is_master` flag), `applications`, `requests` (student↔admin threads, optional `document_id`, urgency + `admin_response`), `comments` (anchored to documents via `position_start/end`)
- Every table has **RLS enabled**: students can `ALL` their own rows; admins get broad `SELECT`/`ALL` via an `EXISTS (… role = 'ADMIN')` subquery. Changing data access usually means editing these policies, not app code.
- Triggers: `update_updated_at_column` on every table; `handle_new_user` / `on_auth_user_created` auto-creates a `profiles` row on signup.
- FK note: child tables reference `profiles(user_id)` (the `auth.users` id), **not** `profiles.id`.

## Known Issues & Beta Status

See BETA_READINESS_REPORT.md and KNOWN_GAPS.md:

**Blocking Issues:**
- Missing route implementations: `/forgot-password`, `/privacy`, `/terms`, `/cookies`
- ESLint errors (`no-explicit-any`, `react/no-unescaped-entities`) prevent clean build
- Mixed demo + Supabase data in some lists

**Non-Blocking:**
- Some admin quick-action buttons are UI-only (no persistence)

## Development Setup

1. Copy `.env.example` → `.env.local` and fill in Supabase credentials
2. Run SQL migrations from `sql/schema.sql` in Supabase dashboard
3. Disable email confirmation in Supabase settings if testing locally (see SETUP.md)
4. `npm install && npm run dev`
5. Access at http://localhost:3001

## Common Patterns

### Adding a New Page
1. Create `src/app/(platform)/[role]/[feature]/page.tsx` — `middleware.ts` already blocks the wrong role from `/admin/*` vs `/student/*`, so no route guard needed in the page
2. Mark as `"use client"` if it needs interactivity (most pages are)
3. Use `useAuth()` for the current `user`/profile; `isAdmin()`/`isStudent()` for conditional UI
4. Wrap with `PageShell` and `PageHeader` components
5. Fetch data via `/api/[role]/[feature]` endpoints; map raw rows through the matching `lib/view-models/` mapper before rendering

### Adding an API Endpoint
1. Create `src/app/api/[role]/[feature]/route.ts`
2. Use `createRouteHandlerClient({ cookies })` for auth
3. `getUser()` → 401 if absent; rely on RLS for row-level authorization (add an explicit role check only if the endpoint needs one beyond RLS)
4. Query Supabase tables
5. Return `NextResponse.json(data, { status: ... })`, all wrapped in try/catch

### Adding a Form Component
1. Define Zod schema for validation
2. Use `useForm` with `zodResolver`
3. Use shadcn/ui form components
4. On submit, call API endpoint and refresh data

## Notes

- **TypeScript:** Strict mode enabled; use `@/` path alias for all imports
- **No Tests:** No test runner is configured in this project
- Clean up ESLint violations to enable CI builds
- Implement missing route stubs listed in KNOWN_GAPS.md
- Migrate admin quick-actions to persist via API
- Monitor Supabase RLS policies as features expand
