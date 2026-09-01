# Performance Baseline Protocol

## Purpose

Capture repeatable baseline measurements before and after frontend optimizations for:

- `/`
- `/student/dashboard`
- `/student/applications`
- `/admin/dashboard`
- `/admin/requests`

## Environment

- Run in local dev: `npm run dev`
- Use Chrome incognito with disabled extensions.
- Use "Fast 3G" + 4x CPU throttling for consistency in comparative runs.
- Execute each scenario 3 times and record median.

## Metrics To Capture

- First Contentful Paint proxy (from Performance trace).
- Largest Contentful Paint proxy (from Performance trace).
- Time to first meaningful UI interaction (button click responsiveness).
- Route transition latency (click -> next page stable render).
- Count of auth/profile/network requests per navigation.
- Long tasks and expensive scripting segments.

## Step-by-Step Procedure

1. Open Chrome DevTools -> Performance.
2. Start recording.
3. Navigate to target route and perform one representative interaction:
   - `/`: submit booking form
   - `/student/dashboard`: open quick action link
   - `/student/applications`: search then open add modal
   - `/admin/dashboard`: open requests page link
   - `/admin/requests`: open response modal
4. Stop recording after route becomes visually stable.
5. Save trace file under `perf-traces/` with naming:
   - `baseline-{route-name}-run{n}.json`
6. Repeat 3 runs.

## Request Audit Checklist

For each measured route, record:

- Number of `/api/*` calls
- Number of auth/session-related calls
- Any duplicate fetches for the same resource
- Any waterfalls that could be parallelized

## Regression Pass Criteria

- No regression > 15% on median route transition time.
- No increase in duplicate auth/profile fetch calls.
- Reduced loading spinner dwell on dashboard/pages after refactor.

## Current Baseline Run Snapshot (2026-04-19)

- `npm run build`: fails during type validation in `src/app/api/admin/requests/[id]/route.ts` (route context typing mismatch for `PUT` second arg).
- `npm run lint`: currently fails with pre-existing repo-wide issues (`no-explicit-any`, unescaped entities, unused vars, etc.).
- Build output shows Edge runtime warnings from Supabase package internals in middleware path.

This snapshot is used as a pre-change quality baseline and indicates existing technical debt unrelated to this implementation batch.
