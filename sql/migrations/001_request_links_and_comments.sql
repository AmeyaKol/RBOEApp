-- =============================================================================
-- MIGRATION 001 — Request links + polymorphic comments
-- =============================================================================
-- Run this in the Supabase SQL editor BEFORE deploying the matching app code.
-- This project has no migration tool; after applying, fold the changes into
-- sql/schema.sql so it stays the source of truth.
--
-- IMPORTANT: the app code that ships with this migration adds `applications`
-- joins to GET /api/student/requests and GET /api/admin/requests. Until this
-- migration runs, those endpoints will 500 and the request pages will not load.
-- Apply this first.
--
-- What this does:
--   1. Lets a request link a university application (document link already exists).
--   2. Lets a comment anchor to EITHER a document OR an application (not both).
--   3. Adds RLS so students see/write comments on their own applications and
--      admins see/write comments on any application.
--   4. Denormalises comment author name/role (profiles RLS hides an admin's
--      profile from a student, so an embedded join renders admin comments as
--      "User" on the student side). Comments are immutable, so this is safe.
--   5. One-time cleanup of the duplicate "Master SOP" / "Master LOR" rows the old
--      documents page created on every visit. Non-destructive: only verbatim
--      placeholder rows referenced by nothing are deleted; any master with real
--      content is kept or demoted to a university copy.
-- =============================================================================
--
-- DRY RUN — run these three SELECTs first and eyeball the numbers before you
-- execute the rest of the file:
--
--   -- (a) how many rows section 5a will DELETE. Expect ~35 for the demo student.
--   --     If it's close to the total master count, the content match is off
--   --     (smart quotes / trailing space) — stop and compare exactly.
--   SELECT count(*) FROM documents d
--   WHERE d.is_master = true
--     AND d.content IN (
--       'Start writing your Statement of Purpose here. This will be your master document that you can customize for different universities.',
--       'Start writing your Letter of Recommendation here. This will be your master document that you can customize for different universities.'
--     )
--     AND NOT EXISTS (SELECT 1 FROM comments c WHERE c.document_id = d.id)
--     AND NOT EXISTS (SELECT 1 FROM requests r WHERE r.document_id = d.id);
--
--   -- (b) confirm no existing comment would violate the one-anchor CHECK (want 0).
--   SELECT count(*) FROM comments
--   WHERE ((document_id IS NOT NULL)::int + (application_id IS NOT NULL)::int) <> 1;
--
--   -- (c) masters that will SURVIVE as content-bearing (kept or demoted), per student+type.
--   SELECT student_id, type, count(*)
--   FROM documents WHERE is_master = true
--   GROUP BY student_id, type ORDER BY 3 DESC;
--
-- After applying, sanity-check the backfill:
--   SELECT author_role, count(*) FROM comments GROUP BY author_role;   -- expect no NULL bucket
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. requests.application_id
-- -----------------------------------------------------------------------------
ALTER TABLE requests
  ADD COLUMN IF NOT EXISTS application_id UUID
  REFERENCES applications(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_requests_application_id ON requests(application_id);


-- -----------------------------------------------------------------------------
-- 2. comments: anchor to a document OR an application
-- -----------------------------------------------------------------------------
ALTER TABLE comments ALTER COLUMN document_id DROP NOT NULL;

ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS application_id UUID
  REFERENCES applications(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_comments_application_id ON comments(application_id);

-- Exactly one anchor must be set. (Arithmetic form avoids any dependence on
-- num_nonnulls() being on the SQL editor's search_path.)
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_one_anchor;
ALTER TABLE comments
  ADD CONSTRAINT comments_one_anchor
  CHECK (
    ((document_id IS NOT NULL)::int + (application_id IS NOT NULL)::int) = 1
  );


-- -----------------------------------------------------------------------------
-- 3. RLS for application-anchored comments
--    (existing document-anchored policies are unchanged and still apply.)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view comments on accessible applications" ON comments;
CREATE POLICY "Users can view comments on accessible applications" ON comments
  FOR SELECT USING (
    application_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = comments.application_id
        AND (
          a.student_id = (SELECT auth.uid())
          OR EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = (SELECT auth.uid()) AND role = 'ADMIN'
          )
        )
    )
  );

DROP POLICY IF EXISTS "Users can create comments on accessible applications" ON comments;
CREATE POLICY "Users can create comments on accessible applications" ON comments
  FOR INSERT WITH CHECK (
    application_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = comments.application_id
        AND (
          a.student_id = (SELECT auth.uid())
          OR EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = (SELECT auth.uid()) AND role = 'ADMIN'
          )
        )
    )
  );


-- -----------------------------------------------------------------------------
-- 4. Denormalised comment author (profiles RLS hides cross-role profiles)
-- -----------------------------------------------------------------------------
ALTER TABLE comments ADD COLUMN IF NOT EXISTS author_name TEXT;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS author_role TEXT;

UPDATE comments c
SET author_name = p.full_name,
    author_role = p.role
FROM profiles p
WHERE p.user_id = c.user_id
  AND c.author_role IS NULL;

-- Every comment that existed before this migration was authored through the
-- student documents page (the only comment UI that shipped), so default any
-- still-null role rather than leave them unattributed.
UPDATE comments SET author_role = 'STUDENT' WHERE author_role IS NULL;


-- -----------------------------------------------------------------------------
-- 5. One-time cleanup of duplicate master documents (non-destructive)
-- -----------------------------------------------------------------------------

-- 5a. Delete only masters that are verbatim placeholder text AND referenced by
--     nothing (no comments, no review requests). Real drafts are never touched.
DELETE FROM documents d
WHERE d.is_master = true
  AND d.content IN (
    'Start writing your Statement of Purpose here. This will be your master document that you can customize for different universities.',
    'Start writing your Letter of Recommendation here. This will be your master document that you can customize for different universities.'
  )
  AND NOT EXISTS (SELECT 1 FROM comments c WHERE c.document_id = d.id)
  AND NOT EXISTS (SELECT 1 FROM requests r WHERE r.document_id = d.id);

-- 5b. Of the content-bearing survivors, keep the most recently updated master
--     per (student, type); demote the rest to university copies. Nothing is
--     destroyed — demoted docs stay readable in the University-Specific list.
WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY student_id, type
           ORDER BY updated_at DESC, id DESC
         ) AS rn
  FROM documents
  WHERE is_master = true
)
UPDATE documents SET is_master = false
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);
