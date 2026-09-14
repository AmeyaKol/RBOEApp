-- =============================================================================
-- MIGRATION 002 — Demo platform: graded request urgency, onboarding,
--                 university research, alumni outreach logger, visa mock
--                 scheduling, document version history.
-- =============================================================================
-- Apply with:  node scripts/apply-sql.mjs sql/migrations/002_demo_platform.sql
-- Safe to re-run (guards on every object). After applying, fold into
-- sql/schema.sql so it stays the source of truth.
--
-- Depends on: 001_request_links_and_comments.sql (requests.application_id,
--             comments.application_id / author_role).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 0. Shared helper: is_admin() — SECURITY DEFINER so RLS policies can call it
--    without recursing into profiles' own policies.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'ADMIN'
  );
$$;


-- -----------------------------------------------------------------------------
-- 1. Enums (guarded — CREATE TYPE has no IF NOT EXISTS)
-- -----------------------------------------------------------------------------
DO $$ BEGIN CREATE TYPE request_urgency AS ENUM ('LOW','NORMAL','HIGH','CRITICAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE request_category AS ENUM ('CHAT','DOCUMENT_EDIT','COLLEGE_LIST','VISA_MOCK','OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE research_status AS ENUM ('PENDING','IN_PROGRESS','COMPLETED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE alumni_status AS ENUM ('ACTIVE','INACTIVE','PENDING');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE outreach_status AS ENUM ('LOGGED','CONTACTED','CONNECTED','CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE visa_interview_status AS ENUM ('REQUESTED','SCHEDULED','COMPLETED','CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE onboarding_status AS ENUM ('INVITED','ACCOUNT_CREATED','FORM_SENT','SUBMITTED','COMPLETED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- -----------------------------------------------------------------------------
-- 2. requests: graded urgency + category, is_urgent kept in sync
-- -----------------------------------------------------------------------------
ALTER TABLE requests
  ADD COLUMN IF NOT EXISTS urgency  request_urgency  NOT NULL DEFAULT 'NORMAL',
  ADD COLUMN IF NOT EXISTS category request_category NOT NULL DEFAULT 'CHAT';

-- Backfill from the legacy boolean and the existing document link.
UPDATE requests SET urgency = 'HIGH'          WHERE is_urgent AND urgency = 'NORMAL';
UPDATE requests SET category = 'DOCUMENT_EDIT' WHERE document_id IS NOT NULL AND category = 'CHAT';

-- Legacy is_urgent must keep working (the current admin page filters on it).
CREATE OR REPLACE FUNCTION sync_request_is_urgent()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_urgent := (NEW.urgency IN ('HIGH','CRITICAL'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_request_is_urgent ON requests;
CREATE TRIGGER trg_sync_request_is_urgent
  BEFORE INSERT OR UPDATE OF urgency ON requests
  FOR EACH ROW EXECUTE FUNCTION sync_request_is_urgent();

CREATE INDEX IF NOT EXISTS idx_requests_urgency  ON requests(urgency);
CREATE INDEX IF NOT EXISTS idx_requests_category ON requests(category);


-- -----------------------------------------------------------------------------
-- 3. profiles: onboarding intake fields + admin write policy
-- -----------------------------------------------------------------------------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone               TEXT,
  ADD COLUMN IF NOT EXISTS undergrad_college   TEXT,
  ADD COLUMN IF NOT EXISTS publications        INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS target_degree       TEXT,
  ADD COLUMN IF NOT EXISTS target_intake       TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_stage    TEXT NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS intake_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS intake_data         JSONB,
  ADD COLUMN IF NOT EXISTS assigned_admin_id   UUID REFERENCES profiles(user_id) ON DELETE SET NULL;

-- Onboarding writes GPA/GRE/TOEFL/etc. onto a *student's* profile. The live DB
-- only has "update own profile" — add an admin-wide update policy.
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
CREATE POLICY "Admins can update any profile" ON profiles
  FOR UPDATE USING (public.is_admin());


-- -----------------------------------------------------------------------------
-- 4. universities (admin research portal; students read admin-verified data)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS universities (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name                 TEXT NOT NULL,
  location             TEXT,
  country              TEXT DEFAULT 'USA',
  website              TEXT,
  us_news_rank         INTEGER,
  cs_rank              INTEGER,
  research_status      research_status NOT NULL DEFAULT 'PENDING',
  overview             TEXT,
  tuition_per_year     NUMERIC(10,2),
  living_cost_per_year NUMERIC(10,2),
  application_fee      NUMERIC(10,2),
  programs             JSONB DEFAULT '[]'::jsonb,
  deadlines            JSONB DEFAULT '[]'::jsonb,
  requirements         JSONB DEFAULT '{}'::jsonb,
  sources              JSONB DEFAULT '[]'::jsonb,
  researched_by        UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at           TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_universities_name ON universities(lower(name));

ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can read universities" ON universities;
CREATE POLICY "Authenticated can read universities" ON universities
  FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Admins manage universities" ON universities;
CREATE POLICY "Admins manage universities" ON universities
  FOR ALL USING (public.is_admin());

DROP TRIGGER IF EXISTS update_universities_updated_at ON universities;
CREATE TRIGGER update_universities_updated_at
  BEFORE UPDATE ON universities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- soft link an application to a researched university
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES universities(id) ON DELETE SET NULL;


-- -----------------------------------------------------------------------------
-- 5. alumni + outreach_log (storage-only logger — nothing is ever sent)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alumni (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name    TEXT NOT NULL,
  email        TEXT,
  phone        TEXT,
  linkedin_url TEXT,
  grad_year    INTEGER,
  university   TEXT,
  program      TEXT,
  job_title    TEXT,
  company      TEXT,
  location     TEXT,
  status       alumni_status NOT NULL DEFAULT 'ACTIVE',
  tips         JSONB DEFAULT '{}'::jsonb,   -- { housing, travel, campus_employment, general }
  notes        TEXT,
  created_by   UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE alumni ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can read alumni" ON alumni;
CREATE POLICY "Authenticated can read alumni" ON alumni
  FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Admins manage alumni" ON alumni;
CREATE POLICY "Admins manage alumni" ON alumni
  FOR ALL USING (public.is_admin());
DROP TRIGGER IF EXISTS update_alumni_updated_at ON alumni;
CREATE TRIGGER update_alumni_updated_at
  BEFORE UPDATE ON alumni
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS outreach_log (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alumni_id  UUID REFERENCES alumni(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  admin_id   UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  channel    TEXT,                       -- email | linkedin | phone | referral
  purpose    TEXT,
  message    TEXT,
  outcome    TEXT,
  status     outreach_status NOT NULL DEFAULT 'LOGGED',
  logged_at  TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_outreach_log_alumni_id  ON outreach_log(alumni_id);
CREATE INDEX IF NOT EXISTS idx_outreach_log_student_id ON outreach_log(student_id);
ALTER TABLE outreach_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage outreach_log" ON outreach_log;
CREATE POLICY "Admins manage outreach_log" ON outreach_log
  FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Students see own outreach" ON outreach_log;
CREATE POLICY "Students see own outreach" ON outreach_log
  FOR SELECT USING (student_id = (SELECT auth.uid()));
DROP TRIGGER IF EXISTS update_outreach_log_updated_at ON outreach_log;
CREATE TRIGGER update_outreach_log_updated_at
  BEFORE UPDATE ON outreach_log
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- -----------------------------------------------------------------------------
-- 6. visa_mock_interviews (scheduling + notification only; no calendar API)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS visa_mock_interviews (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id          UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  application_id      UUID REFERENCES applications(id) ON DELETE SET NULL,
  university_name     TEXT,
  intended_start_date DATE,
  visa_slot_date      DATE,
  notes               TEXT,
  status              visa_interview_status NOT NULL DEFAULT 'REQUESTED',
  scheduled_at        TIMESTAMPTZ,
  interviewer         TEXT DEFAULT 'Rajiv',
  meeting_link        TEXT,
  student_notified    BOOLEAN DEFAULT false,
  feedback            TEXT,
  requested_at        TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at          TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_visa_mock_student_id ON visa_mock_interviews(student_id);
CREATE INDEX IF NOT EXISTS idx_visa_mock_slot_date  ON visa_mock_interviews(visa_slot_date);
ALTER TABLE visa_mock_interviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students manage own visa interviews" ON visa_mock_interviews;
CREATE POLICY "Students manage own visa interviews" ON visa_mock_interviews
  FOR ALL USING (student_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS "Admins manage all visa interviews" ON visa_mock_interviews;
CREATE POLICY "Admins manage all visa interviews" ON visa_mock_interviews
  FOR ALL USING (public.is_admin());
DROP TRIGGER IF EXISTS update_visa_mock_updated_at ON visa_mock_interviews;
CREATE TRIGGER update_visa_mock_updated_at
  BEFORE UPDATE ON visa_mock_interviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- -----------------------------------------------------------------------------
-- 7. onboarding_tasks (admin queue; a task can predate the student account)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS onboarding_tasks (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prospect_name     TEXT NOT NULL,
  prospect_email    TEXT NOT NULL,
  phone             TEXT,
  source            TEXT DEFAULT 'manual',       -- manual | booking
  status            onboarding_status NOT NULL DEFAULT 'INVITED',
  student_id        UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  assigned_admin_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  invite_note       TEXT,
  intake_token      TEXT,
  login_link        TEXT,
  emails_log        JSONB DEFAULT '[]'::jsonb,    -- simulated "sent" emails (records only)
  last_contact_at   TIMESTAMPTZ,
  next_follow_up    DATE,
  created_at        TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at        TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_student_id ON onboarding_tasks(student_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_status     ON onboarding_tasks(status);
ALTER TABLE onboarding_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage onboarding_tasks" ON onboarding_tasks;
CREATE POLICY "Admins manage onboarding_tasks" ON onboarding_tasks
  FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Students see own onboarding task" ON onboarding_tasks;
CREATE POLICY "Students see own onboarding task" ON onboarding_tasks
  FOR SELECT USING (student_id = (SELECT auth.uid()));
DROP TRIGGER IF EXISTS update_onboarding_tasks_updated_at ON onboarding_tasks;
CREATE TRIGGER update_onboarding_tasks_updated_at
  BEFORE UPDATE ON onboarding_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- -----------------------------------------------------------------------------
-- 8. document_versions (history for the SOP/LOR editor; documents.content stays
--    the live copy, each save snapshots the prior text here)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS document_versions (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id  UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  version      INTEGER NOT NULL,
  content      TEXT,
  version_note TEXT,
  edited_by    UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  editor_name  TEXT,
  editor_role  TEXT,
  created_at   TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id);
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View versions of accessible documents" ON document_versions;
CREATE POLICY "View versions of accessible documents" ON document_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_versions.document_id
        AND (d.student_id = (SELECT auth.uid()) OR public.is_admin())
    )
  );
DROP POLICY IF EXISTS "Insert versions on accessible documents" ON document_versions;
CREATE POLICY "Insert versions on accessible documents" ON document_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_versions.document_id
        AND (d.student_id = (SELECT auth.uid()) OR public.is_admin())
    )
  );
