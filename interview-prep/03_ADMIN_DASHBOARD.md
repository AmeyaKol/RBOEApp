# Admin Dashboard: Components and Logic

## Product goal

The admin experience is an operations console. Instead of asking an advisor to inspect every student, it summarizes portfolio health and brings exceptions—urgent requests, approaching deadlines, incomplete onboarding—to the surface. Its layout deliberately uses a more compact density than the student workspace.

## Dashboard aggregation

`/admin/dashboard` consumes one API response containing student/application/request counts, application outcomes, five recent requests, and ten upcoming deadlines. The UI converts this into major action cards, request previews, application status summaries, quick links, and deadline context.

The API verifies the caller’s admin role, uses count queries where possible, joins student names into requests/deadlines, and calculates the acceptance rate from completed outcomes. This central response keeps dashboard composition separate from the component.

Important accuracy note: database aggregation is real, but the mini-calendar dates and some activity UI are still sample presentation. Also, “assigned students” is currently copy rather than enforced tenancy—all admins can query all students. I would add `admin_student_assignments` and scope every admin aggregate through it.

## Student management

`/admin/students` fetches student profiles plus derived application and pending-request summaries. It supports responsive cards, name search, status inference, deadline formatting, and drill-down. A request can send an admin to this page with `?search=<student>`; `useSearchParams` pre-fills the search, reducing navigation friction. The page is wrapped in `Suspense` because it consumes URL search parameters.

The detail route `/admin/students/[userId]` provides academic profile, experience, applications, and request history. This is a useful “single student context” page without duplicating the operational queue.

The current list API performs two additional queries per student inside `Promise.all`. Concurrency limits latency but it is still an N+1 shape. I would replace it with a SQL view/RPC or grouped relational query that returns profile and aggregates in one database round trip, then add pagination and server-side filters. “Add Student,” filters, and edit actions are currently UI placeholders.

## Request triage and response

`/admin/requests` is the strongest admin workflow. The API joins each request with the student’s name/scores and optional linked document. View-model mapping flattens that response for the component. Memoized selectors divide work into urgent-open, regular-open, and completed queues, and statistics make workload visible.

An admin can open student context, inspect linked document content, and respond in `AdminResponseModal`. The modal updates `OPEN`, `IN_PROGRESS`, or `CLOSED`, optionally saves a written response, and records response timestamps. On success, the parent updates just that request in local state, so the queue reacts immediately. UUID detection preserves demo compatibility by locally updating non-database sample items; I would remove that branch once all data is migrated.

This flow demonstrates an architectural decision: joins happen at the API/data layer so the queue item arrives with decision-making context. That reduces client waterfalls and advisor clicks.

## Product prototypes and concrete next versions

- **Onboarding:** currently local task and email-template state. Add onboarding/task/template/message tables, scheduled jobs, delivery webhooks, retry state, and an auditable communication timeline.
- **University research:** currently searchable local university data with tabs for programs, fees, deadlines, requirements, and sources. Normalize universities/programs/research sources, add source freshness and reviewer approval, then allow students to promote a researched program into an application.
- **Alumni outreach:** currently local alumni and outreach tasks. Add consent and contact-preference fields, alumni/student matching, message templates, connection status events, and privacy-aware access controls.
- **Calendar/activity:** implement the linked routes, derive calendar events from application deadlines and follow-ups, and record immutable audit events for sensitive admin mutations.

## Design and QoL choices

- Red accents and badges identify urgency without making every request visually loud.
- Queue tabs match the admin’s mental model rather than exposing raw database filters.
- Compact spacing increases information density, while cards preserve scannability.
- Search handoff, contextual joins, immediate local updates, loading/empty/error states, and clear next-action buttons reduce operational friction.

## Interview sound bite

“I treated the admin dashboard as an exception-management system, not a reporting page. Aggregate views answer ‘what needs attention,’ the request queue supplies student and document context, and drill-down pages support investigation. The next scaling move is assignment-based tenancy and database-side aggregation.”
