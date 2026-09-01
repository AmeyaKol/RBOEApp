# Student Dashboard: Components and Logic

## Product goal

The student experience turns an ambiguous admissions process into four concrete jobs: complete a profile, track applications, develop reusable documents, and ask an advisor for help. The dashboard is a summary and routing surface; detailed work happens in focused pages.

## Dashboard overview

`/student/dashboard` fetches the profile and applications, then derives:

- total, accepted, rejected, and in-progress application counts;
- recent activity from the newest application records;
- deadlines in the next 30 days, sorted and capped at three;
- an academic profile summary and a direct edit action.

Four action cards link to applications, documents, requests, and program research. Responsive card grids collapse from desktop to mobile. Loading, empty, and error states keep the page understandable while data resolves.

One improvement I would make is fetching profile and applications with `Promise.all` or in a server component; they are independent but currently execute sequentially.

## Applications

`/student/applications` is an API-backed tracker. The page maps raw rows into an `ApplicationViewModel`, performs case-insensitive university/program search in memory, calculates status statistics, and renders visual state badges. `AddApplicationModal` owns its controlled form, converts fee/date values at the boundary, posts the record, resets itself, and asks the parent to refresh. Delete requires confirmation and removes the item locally after a successful API call, avoiding an unnecessary full refetch.

The state machine is intentionally small: `RESEARCHING -> APPLYING -> APPLIED -> ACCEPTED/REJECTED/WAITLISTED`. A concrete next feature is an edit/status modal backed by the existing `PUT /api/student/applications/[id]` route, plus reminders keyed from deadlines.

## Documents and collaboration

`/student/documents` models SOP and LOR work around a master-document pattern. On first use it creates default master documents; students can edit and save content, switch document types, create university-specific copies, export plain text, add comments, and submit a review request linked to the current document.

The review request is the key cross-role flow. It stores `document_id`, so the admin request API can join the student profile and document rather than forcing the advisor to search for context. University copies reuse master content but become independent records, which is simple and understandable for an early product.

Current limits should be stated accurately: the editor is a textarea, export is `.txt`, “share with admin” is simulated, comments are document-level in the UI, and version history is not implemented beyond a version field. I would add autosave with conflict/version checks, rich text, snapshots, inline comment ranges, and durable sharing permissions.

There is also an initialization race: the first fetch updates React state asynchronously, then the code checks the older `documents` closure. I would have `fetchDocuments` return the fetched array and decide initialization from that result, with a database uniqueness constraint on one master per student/type.

## Request center

`/student/requests` combines a submission form with active and historical tabs. The student can mark a request urgent and provide a reason. The API always derives `student_id` from the authenticated session and initializes status as `OPEN`; it never trusts a client-supplied owner. The page maps API rows, memoizes active/closed groups, displays queue statistics, resets after success, and refetches to show the persisted record.

Document review uses the same request model instead of inventing a second communication system. This keeps admin prioritization, statuses, timestamps, and responses consistent across meeting, support, and review use cases.

## Reusable frontend decisions

- `PageShell` standardizes width, spacing, and breakpoints; `PageHeader` standardizes hierarchy and action placement.
- shadcn/Radix primitives provide accessible component structure; CVA controls button variants; Lucide gives consistent icon semantics.
- Parent pages own collections and modal visibility; feature modals own form/loading/error state and report success via callbacks.
- Status badges, disabled submit states, spinners, validation messages, and empty-state copy reduce uncertainty.
- Student layouts use comfortable density because this is a guided individual workflow, unlike the denser admin work queue.

## Interview sound bite

“I designed the student UI around progressive commitment: start with a profile and research record, advance an application through explicit states, reuse a master document for each university, and escalate only when human review is valuable. The frontend mirrors that journey, while the shared request model connects it to the admin workflow.”
