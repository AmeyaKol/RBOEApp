# RBOE Interview Narrative

## The 60-second version

RBOE is a role-based graduate-admissions guidance platform. I designed it around two connected workflows: students need one place to track applications, develop documents, monitor deadlines, and request help; administrators need a portfolio view that turns those student actions into a prioritized work queue. I built it as a Next.js full-stack application with separate student and admin route groups, reusable React and shadcn/ui components, Supabase authentication and PostgreSQL persistence, and API routes that enforce identity and ownership.

The most important design decision was not treating the dashboards as two unrelated products. Applications, documents, comments, and requests form one shared data model. A student can create a document and request a review; the admin request center receives the request with joined student and document context, prioritizes urgent work, and records a response. That closed loop is the product’s core value.

The project is still in beta. Core CRUD paths are API-backed, while onboarding, university research, alumni outreach, and parts of the calendar are interactive prototypes. I use those prototypes to validate information architecture before committing to schemas and integrations.

## A strong two-minute walkthrough

1. **Start with the customer problem.** Graduate applications involve deadlines, documents, status changes, and advisor communication spread across multiple tools. RBOE gives both sides a shared operating system.
2. **Explain the role split.** Students get a comfortable, action-oriented workspace; admins get denser, exception-oriented views. Next.js route groups and nested layouts provide shared navigation while preserving role-specific presentation.
3. **Show the end-to-end loop.** A student updates academic data, adds an application, edits a master SOP/LOR, creates a university-specific copy, and submits a review request. The admin sees urgent/regular/completed queues, opens the linked document and student context, then updates the request status and response.
4. **Name the architecture.** React client components own interaction state; Next.js App Router supplies layouts, routing, middleware, and serverless route handlers; Supabase supplies managed Auth and PostgreSQL; database RLS plus API ownership filters provide defense in depth.
5. **Close with judgment.** I deliberately separated persisted workflows from product prototypes. My next step is to convert the validated prototypes into normalized tables and server-rendered, cached read paths, while fixing the current build/type debt.

## Features worth emphasizing

- **Technical:** cookie-backed Supabase sessions; middleware role routing; authenticated API handlers; RLS; relational joins; view-model adapters; memoized list derivation.
- **Design-oriented:** shared `PageShell`, `PageHeader`, card, badge, button, modal, and tab patterns; responsive grids; semantic status colors; compact admin versus comfortable student density.
- **Functional:** application CRUD, profile editing, deadline calculation, document save/copy/comment/export, review requests, admin student drill-down, and response/status updates.
- **Quality of life:** search without reloads, URL-prefilled student search from the request queue, optimistic local removal/update, empty/loading/error states, form reset after success, and auth timeouts that prevent an infinite spinner.

## Accuracy guardrails

Say **“built and API-backed”** for authentication, profiles, applications, documents, comments, requests, the admin student list/detail, and the admin dashboard aggregation. Say **“interactive prototype”** for onboarding, university research, alumni outreach, the mini-calendar’s sample dates, and several placeholder buttons. “Rich-text editor” and “version history” appear in product comments, but the present editor is a textarea and the schema only stores a version number; describe those as planned evolutions.

Do not claim Prisma currently runs the application queries. The repository includes Prisma configuration, but active data access uses the Supabase client and PostgREST. Do not claim a clean production build: repository notes record existing lint and route-typing failures.

## If asked, “What did you personally optimize?”

I introduced a consistent view-model boundary between snake_case API rows and camelCase UI models, memoized derived search and queue lists, used local state updates after mutations where safe, dynamically loaded below-the-fold landing sections, used `next/font`, and added reusable shell components to reduce UI drift. I would not overstate these: most dashboard pages are still client-rendered, and some endpoints have query waterfalls. Moving read-heavy pages to Server Components and consolidating aggregate queries is the next architectural step.

## Source map

Use the other files in this folder for rehearsal. The factual baseline comes from `FEATURE_QA_MATRIX.md`, `KNOWN_GAPS.md`, `BETA_READINESS_REPORT.md`, `sql/schema.sql`, the role-specific pages under `src/app/(platform)`, and their matching handlers under `src/app/api`.
