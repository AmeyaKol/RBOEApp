# RBOE Admin Demo — Walkthrough

A click-by-click script for demoing the admin-facing build. Everything below is
backed by the live Supabase database unless it is called out as **Preview**.

## Setup

```bash
node scripts/seed-demo.mjs      # deterministic reset — safe to re-run any time
npm run dev                     # http://localhost:3001
```

`node scripts/seed-demo.mjs` writes `DEMO_CREDENTIALS.md` (gitignored). All
accounts use the password **`Demo1234!`**.

| Role | Login | Notes |
|---|---|---|
| Admin (owner) | `rajiv@rboe.com` | sees everything |
| Admin | `neha@rboe.com` | counsels Sneha, Rahul |
| Admin | `sameer@rboe.com` | counsels Zara, Vikram |
| Student — applying | `priya@student.com` | 3 apps, master SOP/LOR + Stanford copy |
| Student — visa stage | `arjun@student.com` | ACCEPTED at ASU, visa mock requested |
| Student — accepted | `sneha@student.com` | CMU admit, visa mock completed |
| Student — mid-onboarding | `rahul@student.com` | intake form sent, not submitted |
| Student — researching | `zara@student.com` | intake submitted, 2 apps in research |
| Student — heavy applicant | `vikram@student.com` | 4 apps across statuses |

Booking-only prospect **Ananya Iyer** appears in the onboarding queue with no
account yet.

---

## 1. Student onboarding  (`/admin/onboarding`, as `rajiv@rboe.com`)

1. The queue shows 6 students + 1 booking prospect, each with a derived stage.
2. Select **Ananya Iyer** (INVITED, "from booking") → **Create student account**.
   A one-time temp password + login link appears.
3. Still on Ananya → **Send intake form**.
4. Open a second browser / private window, log in as the new account with the
   temp password → `/student/onboarding` shows the intake form → fill GPA / GRE /
   TOEFL / experience / targets → **Submit intake**.
5. Back as the admin, Ananya now shows **Submitted** with the intake data →
   **Complete onboarding**. The student's profile flips to ACTIVE.

_(For a faster loop, use **Rahul Verma** — already at FORM_SENT — as the student
in step 4.)_

---

## 2. Request management  (`/admin/requests`, as `rajiv@rboe.com`)

1. Requests are split into **Urgent** (HIGH / CRITICAL) and **Regular**
   (LOW / NORMAL), each sorted by urgency then age; the **Topic** chips filter by
   category (chat, document edit, college list, visa mock, other).
2. Open **"SOP review for Stanford — deadline is tomorrow"** (CRITICAL,
   document edit) → **View Document**. This opens the document editor inline:
   edit the text, add a version note, keep **"Close the linked request when I
   save"** checked → **Save version**. The document goes to a new version, the
   change is recorded in history, and the request closes.
3. Open a chat request (e.g. **"Recommender has not submitted yet"**) →
   **Respond** → set status *In progress* / *Completed* and write a reply.
4. As a student (`priya@student.com` → `/student/requests`) you can file a new
   request with a 4-level urgency and a topic; HIGH/CRITICAL requires a reason.

---

## 3. Document editing  (`/admin/students/<id>` → Documents, as an admin)

1. From `/admin/students`, open **Priya Sharma** → **Documents** → click
   **Master SOP**.
2. The editor shows "currently v4" and **History (3)** — expand a past version to
   read it. Each row shows who edited it (student vs admin) and the note.
3. Edit → **Save version** → history grows, live version bumps.
4. As `priya@student.com` → `/student/documents` → **Version History** button
   shows the same timeline, read-only.

---

## 4. Visa mock scheduling  (`/admin/visa-scheduling`, as an admin)

1. The table lists every student's visa slot, sorted by date; status filter chips
   across the top.
2. **Arjun Patel** is REQUESTED → **Schedule** → set the mock date/time, keep
   interviewer *Rajiv*, paste a Meet/Zoom link → **Schedule & notify**. Row flips
   to SCHEDULED and the student is marked notified.
3. **Sneha Reddy** is COMPLETED with feedback — open **Manage** to see it.
4. As `arjun@student.com` → `/student/visa` shows the scheduled time + meeting
   link. The student can also request a new mock from there.

---

## 5. Alumni outreach — logger  (`/admin/alumni-outreach`, as an admin)

1. Directory of 8 alumni with status + per-alumnus outreach counts. Select
   **Ankit Desai** to see his housing / travel / on-campus-employment / general
   tips.
2. **Log an outreach**: pick an optional student, a channel, a purpose, and
   notes → **Log outreach**. It is added to the history — **nothing is sent**;
   the banner and the form both say records-only.
3. Advance an entry through **LOGGED → CONTACTED → CONNECTED → CLOSED** with the
   inline buttons.

---

## 6. University research  (`/admin/university-research`, as an admin)

1. Rank-sorted directory with a research status per university.
2. Select **MIT** (IN_PROGRESS) → fill the cost fields, overview, add a program
   and a source row → set status **Completed** → **Save research**.
3. As a student → `/student/university-research` (linked from the application
   tracker header) shows the verified research read-only, expandable per card.

---

## 7. Business & AI previews  (Preview — not wired to data)

- **`/admin/payroll`** — staff roster, animated **Run payroll**, payslip modal.
- **`/admin/partnerships`** — generate a referral coupon, browse sponsors, view
  campaign funnels.
- **`/admin/analytics`** — admissions funnel, acceptance rate by university,
  request load, revenue line.
- **`/admin/ai-lab`**
  - *College prediction*: pick a student → **Analyze** → deterministic
    Safe / Moderate / Ambitious buckets scored from their GRE/GPA/TOEFL.
  - *SOP / LOR assistant*: **Analyze with AI** streams a simulated review;
    apply confidence-scored suggestions into the draft.

Every one of these shows a **Preview** banner and persists nothing.

---

## Admin navigation

The bar under the header links every admin area. The four Preview areas carry a
"Preview" tag. Students reach their pages from the dashboard quick-action cards
and the onboarding / applications pages.
