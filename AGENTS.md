# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

**RBOE (Rohan's Best Outcomes for Education)** is a Next.js full-stack graduate admissions guidance platform. It is a role-based application serving students preparing graduate school applications and administrators managing those students' progress.

**Tech Stack:**
- **Frontend:** Next.js 15.4.4, React 19, TypeScript 5
- **Styling:** Tailwind CSS 4, shadcn/ui components (new-york style)
- **Backend:** Next.js API Routes (serverless functions)
- **Database:** PostgreSQL via Supabase with Prisma ORM
- **Authentication:** Supabase Auth (email/password)
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
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Auth route group (login, register)
│   ├── (platform)/              # Protected routes group
│   │   ├── admin/               # Admin dashboard and features
│   │   └── student/             # Student dashboard and features
│   ├── api/                     # API routes (serverless endpoints)
│   │   ├── admin/               # Admin mutations
│   │   ├── student/             # Student mutations
│   │   └── auth/                # Auth endpoints
│   └── layout.tsx               # Root layout with fonts & auth provider
├── components/
│   ├── ui/                      # shadcn/ui components (Card, Button, Badge, etc.)
│   ├── features/                # Feature-specific components (EditProfileModal, etc.)
│   ├── layout/                  # Layout components (Header, Hero, Footer)
│   ├── shell/                   # PageShell, PageHeader wrappers
│   ├── auth/                    # Auth-related components
│   └── providers/               # ClientAuthProvider wrapper
├── hooks/
│   └── useAuth.tsx              # Main auth context hook (user, loading, refreshProfile)
├── lib/
│   ├── auth.ts                  # Auth utilities (sign up/sign in, profile management)
│   ├── supabase.ts              # Supabase client setup & types
│   ├── utils.ts                 # Utility functions
│   └── view-models/             # Data mappers (application.ts, document.ts, request.ts)
└── app/globals.css              # Global Tailwind CSS
```

### Authentication & User Context

**Flow:**
1. `ClientAuthProvider` (in root layout) wraps the app with `AuthProvider` (from `useAuth.tsx`)
2. `AuthProvider` manages global auth state: `user` (AuthUser | null), `loading` (boolean), `refreshProfile` (async fn)
3. Uses Supabase client-side auth listeners to track session changes
4. On auth state change, fetches the user's profile from `profiles` table via `getUserProfile()`
5. Pages/components access user context via `useAuth()` hook

**Key Auth Functions in `lib/auth.ts`:**
- `getUserProfile(userId)` — Fetches profile; creates default if missing
- `createUserProfile(userId, role, fullName)` — Called after signup
- `updateUserProfile(userId, updates)` — Updates profile fields
- `signUpWithPassword(email, password, role, fullName)` — Registration
- `signInWithPassword(email, password)` — Login
- `getDashboardRoute(role)` — Route helper (STUDENT → /student/dashboard, ADMIN → /admin/dashboard)

**User Roles:** `'STUDENT' | 'ADMIN'` (defined in `UserRole` type)

### API Route Pattern

All API routes follow this pattern:
1. Get the authenticated user via `createRouteHandlerClient` + Supabase
2. Verify authorization (401 if missing)
3. Query/mutate data from Supabase tables
4. Return `NextResponse.json()` with data or error

Example endpoints: `/api/student/profile` (GET/PUT), `/api/student/applications` (GET/POST)

**Note:** Some pages mix demo/fallback data with real API calls — a known gap documented in KNOWN_GAPS.md.

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
  - `admin/` — Admin-only pages (dashboard, students, requests, etc.)
  - `student/` — Student-only pages (dashboard, applications, documents, etc.)

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
- **.env.example** — Supabase keys, database URL, OpenAI API key, NextAuth secrets
- **components.json** — shadcn/ui config; aliases for components, ui, utils, hooks
- **eslint.config.mjs** — Extends `next/core-web-vitals` and `next/typescript`
- **postcss.config.mjs** — Tailwind CSS 4 with `@tailwindcss/postcss`

## Database & Prisma

**Prisma Schema** (`prisma/schema.prisma`):
- Generator: `prisma-client-js`
- Data source: PostgreSQL (Supabase)

Schema file is minimal; full table definitions are in Supabase via SQL migrations in the `sql/` folder. Run `npx prisma generate` if the schema is updated.

## Known Issues & Beta Status

See BETA_READINESS_REPORT.md and KNOWN_GAPS.md:

**Blocking Issues:**
- Missing route implementations: `/forgot-password`, `/privacy`, `/terms`, `/cookies`, `/admin/calendar`, `/admin/activity-log`
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
1. Create `src/app/(platform)/[role]/[feature]/page.tsx`
2. Mark as `"use client"` if it needs interactivity
3. Use `useAuth()` to check role/permissions
4. Wrap with `PageShell` and `PageHeader` components
5. Fetch data via `/api/[role]/[feature]` endpoints

### Adding an API Endpoint
1. Create `src/app/api/[role]/[feature]/route.ts`
2. Use `createRouteHandlerClient({ cookies })` for auth
3. Verify user + role via `supabase.auth.getUser()`
4. Query Supabase tables
5. Return `NextResponse.json(data, { status: ... })`

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
