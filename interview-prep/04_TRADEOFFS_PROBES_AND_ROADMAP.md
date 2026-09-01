# Tradeoffs, Interview Probes, and Roadmap

## Major decisions and how to defend them

### Why Next.js instead of a separate React SPA and backend?

One codebase provides routing, nested layouts, middleware, API handlers, font optimization, client navigation, and a clear path to server rendering. That was appropriate for a small team and a workflow-heavy product. The tradeoff is that the current client-first implementation does not yet use Server Components and caching as much as it could.

### Why Supabase?

It supplied hosted PostgreSQL, Auth, cookie-aware Next.js helpers, RLS, and relational queries, shortening time to a working secure prototype. The tradeoffs are vendor-specific APIs and the need to design RLS carefully. View-model adapters and standard PostgreSQL tables preserve some portability.

### Why API routes if Supabase can be called from the browser?

They create a stable application boundary: ownership comes from the session, admin roles are rechecked, mutations can validate/default fields, joins can be shaped for specific screens, and database details stay out of feature components. RLS remains a final defense.

### Why client components?

The early product needed fast iteration on tabs, search, editors, forms, and modals. Local React state made those interactions direct. At larger scale, I would server-render initial read models and hydrate only interactive islands, reducing JavaScript and loading waterfalls.

### Why view models?

APIs and Supabase use snake_case and nullable fields; React benefits from consistent camelCase and constrained unions. Central adapters normalize once, prevent components from depending on transport details, and make a gradual demo-to-live migration safer.

### Why local state rather than Zustand?

Most state is page-local: a modal, form, selected request, or search term. Lifting it into a global store would add indirection without solving a cross-page problem. Auth is genuinely global, so it uses context. Zustand is installed but not a core runtime dependency in these flows.

## Likely technical probes

**How do you prevent cross-user access?** Middleware improves navigation, each API authenticates independently, student record queries include `student_id = user.id`, admin endpoints verify role, and RLS repeats ownership/role rules in PostgreSQL.

**How does a document review reach an admin?** The student posts a request with `document_id`; the request table links student, optional admin, and document; the admin endpoint joins profile and document data; the UI queues it by urgency/status and saves the response and timestamps.

**How are deadlines calculated?** The student dashboard filters future application deadlines to 30 days, sorts ascending, and displays the first three. Admin endpoints retrieve upcoming deadlines across students. Production should centralize timezone and “days remaining” logic on the server.

**How do components communicate after a mutation?** A modal owns submission state and invokes a parent callback. The parent either refetches canonical data (create/profile edit) or applies a safe local update (delete/request response). This keeps feature components reusable and collection ownership clear.

**What would break at 10,000 students?** Client-side filtering, unpaginated lists, the admin student N+1 query, full status-row scans for aggregates, and broad admin access. I would add assignment scoping, indexes based on query plans, pagination, SQL aggregation/views, caching, and background jobs for notifications.

## Honest technical debt

- The production build is not clean because of existing lint/type issues, including route-handler typing.
- Several prototype pages and buttons do not persist; linked calendar/activity/legal/password routes are missing.
- Some UX uses browser `alert`/`confirm`; replace with accessible dialogs/toasts.
- Profile validation is duplicated and the GPA limits disagree between UI and SQL.
- Auth/profile checks occur in middleware, context, and APIs; secure, but chatty.
- The auth timeout avoids an infinite spinner but is mitigation, not root-cause observability.
- Tests are absent; current assurance relies on the QA matrix and manual smoke paths.

## Prioritized roadmap

1. **Reliability:** fix type/lint failures, add route error/loading boundaries, schema validation in every mutation, and tests for auth/ownership plus the request lifecycle.
2. **Data correctness:** enforce admin-student assignments, align constraints, add master-document uniqueness, and use migrations as the source of truth.
3. **Performance:** Server Components for initial reads, parallel fetches, SQL aggregates instead of N+1 queries, pagination, and measured cache/revalidation rules.
4. **Product completion:** persist onboarding/research/outreach, build real calendar/activity history, replace simulated sharing, and add notifications.
5. **Document maturity:** autosave, rich text, version snapshots, inline comments, conflict handling, and PDF/DOCX export.

## Bar-raiser framing

Avoid pretending the beta is finished. A stronger answer is: “I made the core student-to-admin loop real, used prototypes to validate adjacent workflows, measured where the architecture would stop scaling, and can explain the order in which I would harden it.” That demonstrates ownership, customer focus, and sound judgment—not just feature count.
