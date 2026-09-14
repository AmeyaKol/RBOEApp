# Known Gaps and Beta Constraints

## Missing or Unimplemented Routes

The following routes are linked in UI but do not currently have page implementations:

- `/forgot-password`
- `/privacy`
- `/terms`
- `/cookies`

`/admin/calendar` and `/admin/activity-log` are now implemented on real data
(`GET /api/admin/calendar`, `GET /api/admin/activity-log`).

## Mixed Data-Mode Risks

- Several pages render lists from `demo-data` while still calling mutation APIs for create/update/delete.
- This can produce false positives in QA where action calls succeed but refreshed lists still come from demo state.

## UI-Only Actions (Non-persistent)

- Some quick actions in admin/student pages are placeholders (buttons/alerts only) and do not persist state.
- Example categories: "View Profile" style buttons, some research/onboarding/outreach actions.

## Recommendations For Beta Validation

- Log each tested feature with `working-demo`, `working-supabase`, or `blocked`.
- Treat missing routes as accepted beta blockers unless explicitly out-of-scope.
- Prioritize mutation correctness (`POST/PUT/DELETE`) and role routing over low-risk static widgets.
