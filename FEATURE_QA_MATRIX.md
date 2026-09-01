# Feature QA Matrix (Demo + Supabase)

Legend:
- `demo_only`: behavior is currently mocked in UI/demo data.
- `api_backed`: behavior depends on API route + backend persistence.
- `mixed`: UI list/state uses demo data while some actions call APIs.

## Public + Auth

| Route | Feature / Action | Data Source Mode | Expected Result |
|---|---|---|---|
| `/` | Render header/hero/services/testimonials/booking/footer | demo_only | All sections load and are scrollable without blocking spinner. |
| `/` | Booking form submit + success/reset flow | demo_only | Submit shows loading, then success state; "Book Another Consultation" resets form. |
| `/login` | Student login | api_backed | Valid student credentials redirect to `/student/dashboard`. |
| `/login` | Admin login | api_backed | Valid admin credentials redirect to `/admin/dashboard`. |
| `/register` | Student registration | api_backed | Form validates and creates account/profile, then redirects to student dashboard. |

## Student Platform

| Route | Feature / Action | Data Source Mode | Expected Result |
|---|---|---|---|
| `/student/dashboard` | Dashboard cards/stats/deadlines render | demo_only | Dashboard loads with profile summary and quick action cards. |
| `/student/dashboard` | Open edit profile modal + save profile | api_backed | Save updates profile via API and dashboard refreshes data. |
| `/student/applications` | List/search applications | demo_only | Search filters cards by university/program without page reload. |
| `/student/applications` | Add application modal submit | api_backed | Modal submit succeeds and list refresh path runs without error. |
| `/student/applications` | Delete application | api_backed | Delete request succeeds and removed item disappears from UI. |
| `/student/documents` | Load SOP/LOR editor + switch tabs | demo_only | Current document updates when tab changes, editor content remains editable. |
| `/student/documents` | Save document | api_backed | Save sends PUT request and no error banner appears. |
| `/student/documents` | Create university copy | api_backed | New copy is created and appears in university-specific documents list. |
| `/student/documents` | Add/list comments | api_backed | New comment appears in comments list and persisted fetch does not error. |
| `/student/requests` | New request submit | api_backed | Request POST succeeds; success alert appears; list refresh runs. |
| `/student/requests` | Active/history tabs | demo_only | Requests are grouped by status and render in correct tab. |

## Admin Platform

| Route | Feature / Action | Data Source Mode | Expected Result |
|---|---|---|---|
| `/admin/dashboard` | Dashboard overview + quick links | demo_only | Dashboard cards and widgets render without runtime errors. |
| `/admin/students` | Students list + search/filter | demo_only | Student cards are filtered correctly by query and selected filters. |
| `/admin/requests` | Urgent/regular/completed tabs | demo_only | Requests display in the correct tab based on status/urgency. |
| `/admin/requests` | Respond via modal | api_backed | PUT update succeeds, modal closes, list refreshes. |
| `/admin/onboarding` | Onboarding workflow UI | demo_only | Static onboarding steps render and user can navigate sections. |
| `/admin/university-research` | University research tabs/actions | demo_only | Tabs and research content render consistently. |
| `/admin/alumni-outreach` | Outreach list/actions | demo_only | Cards and actions render with no runtime errors. |

## Demo Pages

| Route | Feature / Action | Data Source Mode | Expected Result |
|---|---|---|---|
| `/demo` | Open feature cards | demo_only | Cards navigate to AI editor and college predictor pages. |
| `/demo/ai-editor` | Analyze/apply/edit/export/share | demo_only | Simulated AI suggestions and editor interactions complete without crash. |
| `/demo/college-predictor` | Profile select + predictions | demo_only | Safe/moderate/ambitious/dream predictions render for selected profile. |

## Smoke Sequence (Balanced)

1. Public flow: `/` -> booking submit.
2. Student flow: `/login` -> `/student/dashboard` -> `/student/applications` (search/add/delete) -> `/student/documents` (save/comment/create copy) -> `/student/requests` (submit).
3. Admin flow: `/login` -> `/admin/dashboard` -> `/admin/requests` (respond).
4. Demo flow: `/demo` -> `/demo/ai-editor` -> `/demo/college-predictor`.
