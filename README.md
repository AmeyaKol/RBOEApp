# RBOE

**RBOE (Rohan's Best Outcomes for Education)** is a full-stack graduate admissions counseling platform. A small team of admin counselors manages a portfolio of students through the entire MS application journey — onboarding, document drafting, university research, requests, visa prep — while each student gets a focused workspace for their own applications and documents.

![RBOE landing page](public/screenshots/landing.png)

## Tech stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- **Backend:** Next.js API routes on top of Supabase (Postgres + Auth), authorized primarily through row-level security policies
- **State & forms:** Zustand, React Hook Form + Zod
- **UI:** Radix UI, Lucide icons, Framer Motion

## Roles

The app is role-based, gated by middleware (`STUDENT` can't reach `/admin/*`) and by Postgres RLS (students only ever see their own rows; admins get broad access via an `ADMIN` role check).

- **Admin** — a counselor. Owns a portfolio of assigned students and works from a single dashboard that fans out into onboarding, requests, student records, visa scheduling, research, and activity tracking.
- **Student** — sees only their own applications, documents, requests, and visa status, plus admin-verified university research.

Login is a single form with an Admin/Student tab:

![Login screen](public/screenshots/login.png)

## Admin workflow

Everything an admin does starts from the dashboard: live counts of students and pending requests, recent activity, upcoming deadlines, and a card grid that routes into each area.

![Admin dashboard](public/screenshots/admin-dashboard.png)

### Onboarding

New prospects move through a queue: create an account, send the intake form, and review what the student submits (GPA, GRE, TOEFL, work experience, target programs) before flipping their profile to active.

![Student onboarding queue](public/screenshots/admin-onboarding.png)

### Requests

Every student message lands here, split into **Urgent** and **Regular** tabs and ranked by urgency and age, with topic filters (chat, document edit, college list, visa mock, other). A request tied to a document opens an inline editor — edit the text, leave a version note, and optionally close the request on save.

![Request queue](public/screenshots/admin-requests.png)

![Editing a linked document from a request](public/screenshots/admin-request-document-editor.png)

### Students

The full roster with academic stats, next deadline, and pending-request count per student, filterable by name.

![Student roster](public/screenshots/admin-students.png)

Opening a student shows their academic profile, every application, every document, and their request history in one place.

![Student profile detail](public/screenshots/admin-student-profile.png)

Documents are versioned: each save records who edited it (student or admin), an optional change note, and a full history an admin can expand and read.

![Document version history](public/screenshots/admin-student-documents-history.png)

### Visa scheduling

One table of every student's visa mock interview, sorted by date, with status filters (Requested / Scheduled / Completed / Cancelled). Scheduling a mock sets the date, interviewer, and meeting link, and notifies the student.

![Visa mock interview scheduling](public/screenshots/admin-visa-scheduling.png)

### Calendar & activity log

A merged view of application deadlines and visa slots across every assigned student, filterable and linking back to the student record —

![Admin calendar](public/screenshots/admin-calendar.png)

— and a reverse-chronological feed of every request, document, and application change, grouped by day.

![Activity log](public/screenshots/admin-activity-log.png)

### Alumni outreach

A directory of alumni with their program, employer, and advice on housing/travel/on-campus work, plus a log of who reached out to which student and why. This is a records-only feature — nothing is actually sent.

![Alumni outreach directory](public/screenshots/admin-alumni-outreach.png)

### University research

Admin-verified per-university data (cost, rank, programs, deadlines, sourced notes) that students can trust instead of doing this research themselves.

![University research](public/screenshots/admin-university-research.png)

## Student workflow

Students land on their own dashboard — quick actions, application status, profile summary, and upcoming deadlines — then get a mirrored set of pages, scoped to their own data:

![Student dashboard](public/screenshots/student-dashboard.png)

- **Application tracker** — every university applied to, with deadlines, fees, and status.
- **Documents** — write and edit SOP/LOR drafts, with a read-only version-history view of every admin or self edit.
- **Requests** — file a new request with a topic and urgency level (high/critical requires a reason), and track active vs. past requests.
- **Visa mock interviews** — request a mock, then see the scheduled time and meeting link once an admin sets it up.
- **University research** — the same admin-verified data, read-only.

![Student application tracker](public/screenshots/student-applications.png)

![Document editor with version history](public/screenshots/student-documents.png)

![Filing a new request](public/screenshots/student-requests-new.png)

![Scheduled visa mock interview](public/screenshots/student-visa.png)

![University research, student view](public/screenshots/student-university-research.png)

## Business & AI (Preview)

Four additional admin areas are UI previews only — clearly banner-labeled, backed by deterministic or illustrative data, and they persist nothing:

- **Payroll** — staff roster, a simulated monthly run, and a payslip preview.
- **Partnerships** — referral coupon generation, a sponsor list, and campaign funnels.
- **Analytics** — admissions funnel, acceptance rate by university, request load, and revenue, all illustrative.
- **AI Lab** — a college-prediction engine that buckets universities into Safe / Moderate / Ambitious from a student's GRE/GPA/TOEFL profile, and a simulated SOP/LOR review assistant. No external model is called.

![AI Lab college prediction](public/screenshots/admin-preview-ai-lab.png)

![Analytics preview](public/screenshots/admin-preview-analytics.png)

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase URL, anon key, and service-role key
```

1. Run `sql/schema.sql` in your Supabase project's SQL editor to create the tables, enums, triggers, and RLS policies.
2. Disable email confirmation under Supabase → Authentication → Settings if you want to test locally without a mail step (see [SETUP.md](SETUP.md)).
3. Seed a full demo dataset — 3 admins, 6 students, universities, applications, documents, and requests — with:
   ```bash
   node scripts/seed-demo.mjs
   ```
   This writes the generated login credentials to `DEMO_CREDENTIALS.md` (gitignored). See [DEMO_WALKTHROUGH.md](DEMO_WALKTHROUGH.md) for a guided click-through of every feature.
4. Start the dev server:
   ```bash
   npm run dev
   ```
   The app runs at [http://localhost:3001](http://localhost:3001).

## Project structure

```
src/
├── middleware.ts        # Route protection + role-based access control
├── app/
│   ├── (auth)/           # Login, register
│   ├── (platform)/
│   │   ├── admin/        # dashboard, onboarding, requests, students, visa-scheduling,
│   │   │                 # calendar, activity-log, alumni-outreach, university-research,
│   │   │                 # payroll, partnerships, analytics, ai-lab (previews)
│   │   └── student/      # dashboard, onboarding, applications, documents, requests,
│   │                     # visa, university-research
│   └── api/              # REST endpoints backing both trees
├── components/           # ui/, features/, layout/, shell/, auth/
├── hooks/useAuth.tsx      # Auth context (user, loading, refreshProfile)
└── lib/                  # auth.ts, supabase.ts, view-models/

sql/schema.sql            # Source of truth for the database schema and RLS policies
```

See [CLAUDE.md](CLAUDE.md) for a deeper architecture walkthrough, [KNOWN_GAPS.md](KNOWN_GAPS.md) and [BETA_READINESS_REPORT.md](BETA_READINESS_REPORT.md) for current limitations.
