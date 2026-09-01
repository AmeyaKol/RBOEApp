# Architecture and Data Decisions

## System in one sentence

RBOE is a modular monolith: Next.js owns the web UI, route boundaries, middleware, and serverless API layer; Supabase provides managed authentication and PostgreSQL; React components consume task-specific JSON rather than talking directly to tables.

## Request and rendering flow

```text
Browser -> Next.js middleware -> role route/layout -> React page
        -> /api/student/* or /api/admin/* -> Supabase Auth + PostgreSQL
                                           -> RLS policies
```

- The App Router groups public auth pages and protected platform pages without adding route-group names to URLs.
- The root layout loads optimized IBM Plex/Source Serif fonts with `next/font` and wraps the app in one auth provider.
- Middleware redirects unauthenticated users to login and prevents students from entering admin routes. API routes re-check the authenticated user; admin routes also verify the profile role.
- Most feature pages are client components because they contain forms, tabs, modals, search, and local updates. This accelerated iteration, but it also means loading spinners and extra browser-to-API round trips.

## Why Supabase

Supabase reduced infrastructure work in three places: hosted PostgreSQL, email/password Auth with cookie-aware Next.js helpers, and a typed query client capable of relations and filters. This let the project invest in product workflows instead of provisioning a database and auth service.

The tradeoff is deliberate coupling to Supabase APIs and PostgREST response shapes. View-model adapters reduce the UI part of that coupling. The repository has Prisma configuration for future ORM use, but Prisma is not the active query path and its schema has no application models.

## Core data model

| Entity | Key relationship | Product meaning |
|---|---|---|
| `profiles` | one-to-one with `auth.users` via `user_id` | role plus student academic context |
| `applications` | many per student | university, program, state, fee, deadline |
| `documents` | many per student | typed master or university-specific content |
| `requests` | student; optional admin and document | support/review workflow and response state |
| `comments` | many per document and author | collaboration history; positions reserved for inline annotations |

Enums constrain roles, application states, document types, and request states. Foreign keys define deletion behavior, indexes cover common owner/status lookups, triggers maintain `updated_at`, and a signup trigger creates the profile. The schema’s GPA constraint allows 10.0 while the UI validates 4.0; I would resolve that mismatch before broader rollout.

## Security model

There are three layers:

1. **Navigation control:** middleware routes users to the correct workspace.
2. **API authorization:** handlers call `auth.getUser`; admin handlers verify `profiles.role`; student mutations filter by both record ID and `student_id`.
3. **Database enforcement:** RLS limits students to their records and grants admins broader access.

Middleware is user experience, not the security boundary. API checks and RLS remain necessary because APIs can be called directly. A production hardening step is to make admin assignment explicit: the UI says “assigned students,” but the current schema and queries expose all students to any admin.

## Frontend data boundary

Supabase returns snake_case rows. `application.ts`, `document.ts`, and `request.ts` normalize them into camelCase view models, apply defaults, and constrain status strings. Components then render stable concepts such as `universityName`, `isMaster`, and `adminResponse`. This prevents payload changes and demo data from leaking throughout the component tree.

Pages derive presentation state from source data: application counts, 30-day deadlines, student status, and urgent/regular/completed request queues. `useMemo` is used for searches and filtered document/request lists so unrelated state changes do not repeat list work.

## Next.js build and performance answer

Implemented: Turbopack for faster local development, App Router layouts for shared code, link-based client navigation/prefetching, dynamic imports for Testimonials and BookingForm, automatic font optimization, memoized selectors, and middleware exclusions for APIs/static assets.

Not yet implemented: a tuned `next.config`, widespread Server Components, a cache/revalidation policy, route-level error boundaries, or complete image optimization. A strong next iteration would server-render read-heavy dashboards, fetch independent data in parallel, retain small client islands for forms/modals, and add SWR/React Query only where client revalidation is valuable.
