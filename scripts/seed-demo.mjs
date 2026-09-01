/**
 * Deterministic demo seed for the RBOE admin walkthrough.
 *
 *   node scripts/seed-demo.mjs
 *
 * Wipes the domain tables + all auth users and rebuilds a fixed world:
 *   3 admins, 6 student accounts (+1 booking-only prospect), 8 universities,
 *   8 alumni, applications / documents / requests across every status and
 *   urgency level, visa mock interviews, and an outreach log.
 *
 * Re-runnable: every run truncates and recreates. Logins are written to
 * DEMO_CREDENTIALS.md (gitignored).
 *
 * Requires in .env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 * and a direct postgresql:// DATABASE_URL (or SUPABASE_DB_URL).
 */
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { withClient } from './lib/db.mjs';
import { ENV, ROOT } from './lib/env.mjs';

const PASSWORD = 'Demo1234!';
const sb = createClient(ENV.NEXT_PUBLIC_SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------
const ADMINS = [
  { email: 'rajiv@rboe.com',  full_name: 'Rajiv Menon',  title: 'Founder & Senior Counselor' },
  { email: 'neha@rboe.com',   full_name: 'Neha Kapoor',  title: 'Admissions Counselor' },
  { email: 'sameer@rboe.com', full_name: 'Sameer Rao',   title: 'Admissions Counselor' },
];

// onboarding_stage: INVITED | ACCOUNT_CREATED | FORM_SENT | SUBMITTED | ACTIVE
const STUDENTS = [
  {
    email: 'priya@student.com', full_name: 'Priya Sharma', admin: 'rajiv@rboe.com',
    stage: 'ACTIVE', phone: '+91 98200 11001',
    gre_score: 328, toefl_score: 112, undergrad_gpa: 3.9, work_experience_months: 24,
    undergrad_college: 'IIT Bombay', publications: 2,
    target_degree: 'MS Computer Science', target_intake: 'Fall 2026',
  },
  {
    email: 'arjun@student.com', full_name: 'Arjun Patel', admin: 'rajiv@rboe.com',
    stage: 'ACTIVE', phone: '+91 98200 11002',
    gre_score: 315, toefl_score: 105, undergrad_gpa: 3.5, work_experience_months: 18,
    undergrad_college: 'NIT Trichy', publications: 0,
    target_degree: 'MS Electrical Engineering', target_intake: 'Fall 2026',
  },
  {
    email: 'sneha@student.com', full_name: 'Sneha Reddy', admin: 'neha@rboe.com',
    stage: 'ACTIVE', phone: '+91 98200 11003',
    gre_score: 322, toefl_score: 109, undergrad_gpa: 3.8, work_experience_months: 12,
    undergrad_college: 'BITS Pilani', publications: 1,
    target_degree: 'MS Data Science', target_intake: 'Fall 2026',
  },
  {
    email: 'rahul@student.com', full_name: 'Rahul Verma', admin: 'neha@rboe.com',
    stage: 'FORM_SENT', phone: '+91 98200 11004',
    gre_score: null, toefl_score: null, undergrad_gpa: null, work_experience_months: null,
    undergrad_college: null, publications: 0, target_degree: null, target_intake: null,
  },
  {
    email: 'zara@student.com', full_name: 'Zara Khan', admin: 'sameer@rboe.com',
    stage: 'SUBMITTED', phone: '+91 98200 11005',
    gre_score: 311, toefl_score: 101, undergrad_gpa: 3.3, work_experience_months: 6,
    undergrad_college: 'Delhi Technological University', publications: 0,
    target_degree: 'MS Information Systems', target_intake: 'Spring 2027',
  },
  {
    email: 'vikram@student.com', full_name: 'Vikram Singh', admin: 'sameer@rboe.com',
    stage: 'ACTIVE', phone: '+91 98200 11006',
    gre_score: 319, toefl_score: 107, undergrad_gpa: 3.6, work_experience_months: 30,
    undergrad_college: 'VIT Vellore', publications: 1,
    target_degree: 'MS Computer Science', target_intake: 'Fall 2026',
  },
];

// A prospect who only filled the public booking form — no account yet.
const BOOKING_PROSPECT = {
  prospect_name: 'Ananya Iyer', prospect_email: 'ananya.iyer@example.com',
  phone: '+91 98200 11007', admin: 'sameer@rboe.com',
};

// ---------------------------------------------------------------------------
// Universities
// ---------------------------------------------------------------------------
const RESEARCH_FULL = (over) => ({
  programs: [
    { name: 'MS in Computer Science', degree: 'MS', duration: '2 years', deadline: '2026-12-15' },
    { name: 'MS in Data Science', degree: 'MS', duration: '1.5 years', deadline: '2027-01-15' },
  ],
  deadlines: [
    { program: 'MS Computer Science', deadline: '2026-12-15', priority: 'high' },
    { program: 'MS Data Science', deadline: '2027-01-15', priority: 'medium' },
  ],
  requirements: { gre: 'Recommended 320+', toefl: '100 minimum', gpa: '3.3 / 10-scale ~8.0', lors: 3 },
  sources: [
    { name: 'Official program page', url: 'https://example.edu/grad/cs', checked: '2026-08-20' },
    { name: 'US News', url: 'https://usnews.com', checked: '2026-08-20' },
  ],
  ...over,
});

const UNIVERSITIES = [
  { name: 'Stanford University', location: 'Stanford, CA', website: 'https://www.stanford.edu',
    us_news_rank: 3, cs_rank: 1, research_status: 'COMPLETED',
    overview: 'Elite private research university; CS program is extremely selective with strong AI/systems groups.',
    tuition_per_year: 58000, living_cost_per_year: 24000, application_fee: 125, research: RESEARCH_FULL() },
  { name: 'Carnegie Mellon University', location: 'Pittsburgh, PA', website: 'https://www.cmu.edu',
    us_news_rank: 24, cs_rank: 1, research_status: 'COMPLETED',
    overview: 'Top-ranked for CS; SCS offers MSCS, MITS, and MSML tracks. Cost of living is moderate.',
    tuition_per_year: 52000, living_cost_per_year: 20000, application_fee: 100, research: RESEARCH_FULL() },
  { name: 'Georgia Institute of Technology', location: 'Atlanta, GA', website: 'https://www.gatech.edu',
    us_news_rank: 33, cs_rank: 6, research_status: 'COMPLETED',
    overview: 'Large public tech school; excellent value, strong OMSCS and on-campus MSCS. Rolling-ish deadlines.',
    tuition_per_year: 30000, living_cost_per_year: 18000, application_fee: 85, research: RESEARCH_FULL() },
  { name: 'Massachusetts Institute of Technology', location: 'Cambridge, MA', website: 'https://www.mit.edu',
    us_news_rank: 1, cs_rank: 1, research_status: 'IN_PROGRESS',
    overview: 'Research powerhouse. EECS grad admissions are PhD-focused; terminal MS is limited.',
    tuition_per_year: 60000, living_cost_per_year: 25000, application_fee: 90, research: { sources: [] } },
  { name: 'University of California, Berkeley', location: 'Berkeley, CA', website: 'https://www.berkeley.edu',
    us_news_rank: 15, cs_rank: 1, research_status: 'PENDING',
    overview: 'Public flagship; MEng is course-based and one year. High cost of living.',
    tuition_per_year: 30000, living_cost_per_year: 26000, application_fee: 140, research: {} },
  { name: 'University of Michigan, Ann Arbor', location: 'Ann Arbor, MI', website: 'https://umich.edu',
    us_news_rank: 21, cs_rank: 11, research_status: 'PENDING',
    overview: 'Strong all-round public research university; healthy MS cohort and funding options.',
    tuition_per_year: 32000, living_cost_per_year: 16000, application_fee: 90, research: {} },
  { name: 'University of Texas at Austin', location: 'Austin, TX', website: 'https://www.utexas.edu',
    us_news_rank: 32, cs_rank: 8, research_status: 'PENDING',
    overview: 'Top public CS; MSCS is competitive. Austin tech job market is a plus.',
    tuition_per_year: 24000, living_cost_per_year: 18000, application_fee: 75, research: {} },
  { name: 'Arizona State University', location: 'Tempe, AZ', website: 'https://www.asu.edu',
    us_news_rank: 105, cs_rank: 42, research_status: 'PENDING',
    overview: 'Large, accessible admissions; good safety school with solid engineering resources.',
    tuition_per_year: 23000, living_cost_per_year: 15000, application_fee: 70, research: {} },
];

// ---------------------------------------------------------------------------
// Alumni
// ---------------------------------------------------------------------------
const tip = (housing, travel, campus_employment, general) => ({ housing, travel, campus_employment, general });
const ALUMNI = [
  { full_name: 'Rajesh Kumar', email: 'rajesh.k@example.com', grad_year: 2022, university: 'Stanford University',
    program: 'MS Computer Science', job_title: 'Software Engineer', company: 'Google', location: 'Mountain View, CA',
    status: 'ACTIVE', linkedin_url: 'https://linkedin.com/in/example-rajeshk',
    tips: tip('Look at Escondido Village grad housing first; apply the day the portal opens.',
             'Fly into SFO, then Caltrain + campus Marguerite shuttle is free.',
             'CURA and CS department TA/CA roles pay well; email professors before term starts.',
             'Get the student Clipper card and set up a US bank account in week one.') },
  { full_name: 'Priyanka Mehta', email: 'priyanka.m@example.com', grad_year: 2021, university: 'Massachusetts Institute of Technology',
    program: 'MS Data Science', job_title: 'Data Scientist', company: 'Meta', location: 'Menlo Park, CA',
    status: 'ACTIVE', linkedin_url: 'https://linkedin.com/in/example-priyankam',
    tips: tip('Sidney-Pacific and Ashdown are the grad dorms; off-campus in Cambridge is pricey.',
             'Logan airport, then the Red Line to Kendall/MIT.',
             'RA positions are common after the first semester; talk to your advisor early.',
             'Winter gear is non-negotiable — buy a real coat before January.') },
  { full_name: 'Ankit Desai', email: 'ankit.d@example.com', grad_year: 2023, university: 'Carnegie Mellon University',
    program: 'MS Computer Science', job_title: 'SDE II', company: 'Amazon', location: 'Seattle, WA',
    status: 'ACTIVE', linkedin_url: 'https://linkedin.com/in/example-ankitd',
    tips: tip('Oakland and Squirrel Hill are walkable to campus; use the CMU housing Facebook group.',
             'PIT airport, 28X bus goes straight to Oakland.',
             'SCS grader/TA roles open mid-semester; the pay covers rent.',
             'Pittsburgh is cheap — you can live well on a TA stipend.') },
  { full_name: 'Sara Thomas', email: 'sara.t@example.com', grad_year: 2022, university: 'Georgia Institute of Technology',
    program: 'MS Computer Science', job_title: 'ML Engineer', company: 'NVIDIA', location: 'Santa Clara, CA',
    status: 'PENDING', linkedin_url: 'https://linkedin.com/in/example-sarat',
    tips: tip('Home Park and Midtown; GT publishes an off-campus housing fair listing.',
             'ATL airport, MARTA gold/red line to Midtown station.',
             'GRA/GTA roles are plentiful and often waive tuition — ask the department.',
             'Get a MARTA Breeze card; the campus Stinger buses are free.') },
  { full_name: 'Rahul Nair', email: 'rahul.n@example.com', grad_year: 2021, university: 'University of California, Berkeley',
    program: 'MEng EECS', job_title: 'Hardware Engineer', company: 'Apple', location: 'Cupertino, CA',
    status: 'ACTIVE', linkedin_url: 'https://linkedin.com/in/example-rahuln',
    tips: tip('I-House and Manville for grads; the East Bay rental market is brutal, start 2 months out.',
             'OAK is closer than SFO; BART drops you at Downtown Berkeley.',
             'GSI roles for lower-div CS courses are competitive but well paid.',
             'Budget aggressively — Bay Area rent will be your biggest shock.') },
  { full_name: 'Meera Joshi', email: 'meera.j@example.com', grad_year: 2023, university: 'University of Michigan, Ann Arbor',
    program: 'MS Information', job_title: 'Product Analyst', company: 'Google', location: 'Ann Arbor, MI',
    status: 'ACTIVE', linkedin_url: 'https://linkedin.com/in/example-meeraj',
    tips: tip('Northwood grad apartments; Kerrytown and Old West Side if you want off-campus.',
             'DTW airport, the Michigan Flyer bus runs hourly to campus.',
             'GSI/GSRA appointments include tuition waiver + stipend + health — prioritize these.',
             'Winters are long; the campus is very walkable and buses are free with M-Card.') },
  { full_name: 'Vivek Anand', email: 'vivek.a@example.com', grad_year: 2022, university: 'University of Texas at Austin',
    program: 'MS Computer Science', job_title: 'Backend Engineer', company: 'Stripe', location: 'Austin, TX',
    status: 'INACTIVE', linkedin_url: 'https://linkedin.com/in/example-viveka',
    tips: tip('Riverside and North Campus; West Campus is student-dense but pricier.',
             'AUS airport, the 20 bus or a short rideshare to campus.',
             'TA roles in the CS department are the main funding route for MS students.',
             'No state income tax; summers are extremely hot, plan indoor commutes.') },
  { full_name: 'Divya Krishnan', email: 'divya.k@example.com', grad_year: 2023, university: 'Arizona State University',
    program: 'MS Computer Science', job_title: 'Software Engineer', company: 'Intel', location: 'Chandler, AZ',
    status: 'ACTIVE', linkedin_url: 'https://linkedin.com/in/example-divyak',
    tips: tip('Tempe near the light rail; University House and Vista del Sol for students.',
             'PHX Sky Harbor, the Valley Metro light rail goes straight to Tempe campus.',
             'Grad assistantships exist but are fewer — apply the moment you are admitted.',
             'Cost of living is low; a car helps but the light rail covers campus + airport.') },
];

// ===========================================================================
// Run
// ===========================================================================
async function resetAuthUsers() {
  const { data, error } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  for (const u of data.users) {
    await sb.auth.admin.deleteUser(u.id);
  }
  console.log(`  deleted ${data.users.length} existing auth users`);

  const created = {}; // email -> user_id
  const all = [
    ...ADMINS.map((a) => ({ ...a, role: 'ADMIN' })),
    ...STUDENTS.map((s) => ({ ...s, role: 'STUDENT' })),
  ];
  for (const p of all) {
    const { data: u, error: e } = await sb.auth.admin.createUser({
      email: p.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: p.full_name, role: p.role },
    });
    if (e) throw new Error(`createUser ${p.email}: ${e.message}`);
    created[p.email] = u.user.id;
  }
  console.log(`  created ${all.length} auth users`);
  return created;
}

async function main() {
  console.log('1. resetting auth users + profiles ...');
  const uid = await resetAuthUsers();

  await withClient(async (c) => {
    const q = (text, params) => c.query(text, params);

    console.log('2. truncating domain tables ...');
    await q(`truncate table
      document_versions, outreach_log, visa_mock_interviews, onboarding_tasks,
      comments, requests, applications, documents, alumni, universities
      restart identity cascade`);

    console.log('3. creating profiles ...');
    // We create profile rows explicitly rather than relying on the
    // handle_new_user trigger (it does not fire for auth.admin.createUser here).
    for (const a of ADMINS) {
      await q(
        `insert into profiles (user_id, full_name, role, onboarding_stage)
         values ($1,$2,'ADMIN','ACTIVE')
         on conflict (user_id) do update set
           full_name=excluded.full_name, role='ADMIN', onboarding_stage='ACTIVE'`,
        [uid[a.email], a.full_name]
      );
    }
    // admins first, so assigned_admin_id FKs resolve
    for (const s of STUDENTS) {
      await q(
        `insert into profiles
           (user_id, full_name, role, phone, gre_score, toefl_score, undergrad_gpa,
            work_experience_months, undergrad_college, publications, target_degree,
            target_intake, onboarding_stage, assigned_admin_id, intake_submitted_at, intake_data)
         values ($1,$2,'STUDENT',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,
           case when $12 in ('SUBMITTED','ACTIVE') then now() else null end,
           case when $12 in ('SUBMITTED','ACTIVE')
             then jsonb_build_object('undergrad_college',$8::text,'publications',$9::int,
                                     'target_degree',$10::text,'target_intake',$11::text)
             else null end)
         on conflict (user_id) do update set
           full_name=excluded.full_name, role='STUDENT', phone=excluded.phone,
           gre_score=excluded.gre_score, toefl_score=excluded.toefl_score,
           undergrad_gpa=excluded.undergrad_gpa, work_experience_months=excluded.work_experience_months,
           undergrad_college=excluded.undergrad_college, publications=excluded.publications,
           target_degree=excluded.target_degree, target_intake=excluded.target_intake,
           onboarding_stage=excluded.onboarding_stage, assigned_admin_id=excluded.assigned_admin_id,
           intake_submitted_at=excluded.intake_submitted_at, intake_data=excluded.intake_data`,
        [uid[s.email], s.full_name, s.phone, s.gre_score, s.toefl_score, s.undergrad_gpa,
         s.work_experience_months, s.undergrad_college, s.publications, s.target_degree,
         s.target_intake, s.stage, uid[s.admin]]
      );
    }

    console.log('4. universities ...');
    const univId = {};
    for (const u of UNIVERSITIES) {
      const r = u.research || {};
      const { rows } = await q(
        `insert into universities
          (name, location, website, us_news_rank, cs_rank, research_status, overview,
           tuition_per_year, living_cost_per_year, application_fee,
           programs, deadlines, requirements, sources, researched_by)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         returning id`,
        [u.name, u.location, u.website, u.us_news_rank, u.cs_rank, u.research_status, u.overview,
         u.tuition_per_year, u.living_cost_per_year, u.application_fee,
         JSON.stringify(r.programs || []), JSON.stringify(r.deadlines || []),
         JSON.stringify(r.requirements || {}), JSON.stringify(r.sources || []),
         u.research_status === 'PENDING' ? null : uid['rajiv@rboe.com']]
      );
      univId[u.name] = rows[0].id;
    }

    console.log('5. alumni ...');
    const alumniId = {};
    for (const a of ALUMNI) {
      const { rows } = await q(
        `insert into alumni
          (full_name, email, phone, linkedin_url, grad_year, university, program,
           job_title, company, location, status, tips, created_by)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) returning id`,
        [a.full_name, a.email, a.phone || null, a.linkedin_url, a.grad_year, a.university,
         a.program, a.job_title, a.company, a.location, a.status, JSON.stringify(a.tips),
         uid['rajiv@rboe.com']]
      );
      alumniId[a.full_name] = rows[0].id;
    }

    console.log('6. applications ...');
    // helper: add an application, return id
    const addApp = async (email, uniName, program, status, deadline, fee) => {
      const { rows } = await q(
        `insert into applications
          (student_id, university_name, program_name, status, deadline, application_fee, university_id)
         values ($1,$2,$3,$4,$5,$6,$7) returning id`,
        [uid[email], uniName, program, status, deadline, fee, univId[uniName] || null]
      );
      return rows[0].id;
    };
    const app = {};
    app.priyaStanford = await addApp('priya@student.com', 'Stanford University', 'MS Computer Science', 'APPLIED', '2026-12-15', 125);
    app.priyaMIT      = await addApp('priya@student.com', 'Massachusetts Institute of Technology', 'MS EECS', 'APPLYING', '2026-12-15', 90);
    app.priyaGT       = await addApp('priya@student.com', 'Georgia Institute of Technology', 'MS Computer Science', 'RESEARCHING', '2027-01-15', 85);
    app.arjunASU      = await addApp('arjun@student.com', 'Arizona State University', 'MS Electrical Engineering', 'ACCEPTED', '2026-02-01', 70);
    app.arjunUT       = await addApp('arjun@student.com', 'University of Texas at Austin', 'MS ECE', 'REJECTED', '2026-01-15', 75);
    app.snehaCMU      = await addApp('sneha@student.com', 'Carnegie Mellon University', 'MS Data Science', 'ACCEPTED', '2026-01-05', 100);
    app.snehaGT       = await addApp('sneha@student.com', 'Georgia Institute of Technology', 'MS Analytics', 'WAITLISTED', '2026-01-15', 85);
    app.zaraMich      = await addApp('zara@student.com', 'University of Michigan, Ann Arbor', 'MS Information', 'RESEARCHING', '2027-01-15', 90);
    app.zaraASU       = await addApp('zara@student.com', 'Arizona State University', 'MS Information Systems', 'RESEARCHING', '2027-02-01', 70);
    app.vikramGT      = await addApp('vikram@student.com', 'Georgia Institute of Technology', 'MS Computer Science', 'APPLIED', '2026-11-01', 85);
    app.vikramUT      = await addApp('vikram@student.com', 'University of Texas at Austin', 'MS Computer Science', 'APPLYING', '2026-12-15', 75);
    app.vikramBerk    = await addApp('vikram@student.com', 'University of California, Berkeley', 'MEng EECS', 'APPLYING', '2026-12-01', 140);
    app.vikramASU     = await addApp('vikram@student.com', 'Arizona State University', 'MS Computer Science', 'APPLIED', '2026-10-01', 70);

    console.log('7. documents ...');
    const now = new Date().toISOString();
    const addDoc = async (email, type, title, content, is_master, version = 1) => {
      const { rows } = await q(
        `insert into documents (student_id, type, title, content, version, is_master, created_at, updated_at)
         values ($1,$2,$3,$4,$5,$6,$7,$7) returning id`,
        [uid[email], type, title, content, version, is_master, now]
      );
      return rows[0].id;
    };
    const doc = {};
    const SOP_MASTER = `I am applying for a Master's in Computer Science to deepen my foundation in distributed systems and machine learning. During my undergraduate studies I built [project] and interned at [company], where I owned [contribution]. My goal is to work on large-scale infrastructure, and your program's strengths in systems research make it the right fit.`;
    const LOR_MASTER = `It is my pleasure to recommend [student] for graduate study. As their [role] for [duration], I saw them consistently deliver rigorous work, mentor peers, and take ownership of ambiguous problems. They rank in the top 5% of students I have taught.`;

    doc.priyaSOP = await addDoc('priya@student.com', 'SOP', 'Master SOP', SOP_MASTER, true, 3);
    doc.priyaLOR = await addDoc('priya@student.com', 'LOR', 'Master LOR', LOR_MASTER, true, 1);
    doc.priyaStanfordSOP = await addDoc('priya@student.com', 'SOP', 'SOP — Stanford CS',
      SOP_MASTER + '\n\n[Stanford-specific paragraph: named faculty, lab, and course sequence.]', false, 2);
    doc.arjunSOP = await addDoc('arjun@student.com', 'SOP', 'Master SOP', SOP_MASTER, true, 2);
    doc.arjunLOR = await addDoc('arjun@student.com', 'LOR', 'Master LOR', LOR_MASTER, true, 1);
    doc.snehaSOP = await addDoc('sneha@student.com', 'SOP', 'Master SOP', SOP_MASTER, true, 2);
    doc.snehaLOR = await addDoc('sneha@student.com', 'LOR', 'Master LOR', LOR_MASTER, true, 1);
    doc.vikramSOP = await addDoc('vikram@student.com', 'SOP', 'Master SOP', SOP_MASTER, true, 1);
    doc.vikramLOR = await addDoc('vikram@student.com', 'LOR', 'Master LOR', LOR_MASTER, true, 2);
    doc.zaraResume = await addDoc('zara@student.com', 'RESUME', 'Master Resume', 'Zara Khan — resume draft. Education, experience, projects, skills.', true, 1);

    console.log('8. document versions (history for Priya master SOP) ...');
    const addVersion = async (documentId, version, content, note, editorEmail, role) => {
      await q(
        `insert into document_versions (document_id, version, content, version_note, edited_by, editor_name, editor_role)
         values ($1,$2,$3,$4,$5,$6,$7)`,
        [documentId, version, content, note, uid[editorEmail],
         [...ADMINS, ...STUDENTS].find((p) => p.email === editorEmail).full_name, role]
      );
    };
    await addVersion(doc.priyaSOP, 1, 'First full draft of the statement of purpose.', 'Initial draft', 'priya@student.com', 'STUDENT');
    await addVersion(doc.priyaSOP, 2, SOP_MASTER.replace('your program', 'the department'), 'Tightened intro, cut two filler sentences', 'rajiv@rboe.com', 'ADMIN');

    console.log('9. requests (urgency x category x status) ...');
    const addReq = async (email, title, description, urgency, category, status, opts = {}) => {
      const { rows } = await q(
        `insert into requests
          (student_id, admin_id, document_id, application_id, title, description,
           status, urgency, category, urgent_reason, admin_response, responded_at, created_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) returning id`,
        [uid[email], opts.adminEmail ? uid[opts.adminEmail] : null,
         opts.documentId || null, opts.applicationId || null, title, description,
         status, urgency, category, opts.urgentReason || null, opts.adminResponse || null,
         opts.adminResponse ? now : null, opts.createdAt || now]
      );
      return rows[0].id;
    };
    await addReq('priya@student.com', 'SOP review for Stanford — deadline is tomorrow',
      'Can you do a final pass on my Stanford-specific SOP? I want to submit tonight.',
      'CRITICAL', 'DOCUMENT_EDIT', 'OPEN',
      { documentId: doc.priyaStanfordSOP, urgentReason: 'Submission deadline in <24h' });
    await addReq('priya@student.com', 'Which programs actually match my profile?',
      'I have a shortlist of 8. Can we cut it to a realistic 5-6?',
      'NORMAL', 'COLLEGE_LIST', 'CLOSED',
      { adminEmail: 'rajiv@rboe.com',
        adminResponse: 'Keep Stanford (ambitious), MIT (ambitious), CMU + GT (target), UMich + ASU (safe). Drop Berkeley MEng and UT — weaker ROI for your goals.' });
    await addReq('priya@student.com', 'Recommender has not submitted yet',
      'Prof. Rao still has not uploaded the LOR and the portal closes in 3 days.',
      'CRITICAL', 'CHAT', 'IN_PROGRESS', { adminEmail: 'rajiv@rboe.com' });
    await addReq('vikram@student.com', 'Help with LOR wording',
      'My manager wrote a rough LOR. Can you help make it stronger without changing the facts?',
      'HIGH', 'DOCUMENT_EDIT', 'IN_PROGRESS',
      { adminEmail: 'sameer@rboe.com', documentId: doc.vikramLOR });
    await addReq('vikram@student.com', 'Application fee waiver — am I eligible?',
      'Does GT offer fee waivers for international applicants?',
      'LOW', 'CHAT', 'OPEN');
    await addReq('zara@student.com', 'Finalize my college list',
      'I have researched Michigan and ASU. Where else should I look for Spring 2027?',
      'NORMAL', 'COLLEGE_LIST', 'OPEN');
    await addReq('zara@student.com', 'Feedback on my resume',
      'First draft attached. Is the format right for US MS applications?',
      'NORMAL', 'DOCUMENT_EDIT', 'OPEN', { documentId: doc.zaraResume });
    await addReq('arjun@student.com', 'Requesting a visa mock interview',
      'ASU I-20 received, visa slot booked for Sep 22. Need a mock before then.',
      'HIGH', 'VISA_MOCK', 'OPEN', { adminEmail: 'rajiv@rboe.com' });
    await addReq('arjun@student.com', 'Quick typo check on my SOP',
      'Just need a proofread, no structural changes.',
      'LOW', 'DOCUMENT_EDIT', 'CLOSED',
      { adminEmail: 'rajiv@rboe.com', documentId: doc.arjunSOP,
        adminResponse: 'Fixed 4 typos and one tense slip in para 3. Good to go.' });
    await addReq('sneha@student.com', 'Thank you + I-20 question',
      'Accepted CMU! Do I request the I-20 before or after paying the deposit?',
      'LOW', 'CHAT', 'CLOSED',
      { adminEmail: 'neha@rboe.com',
        adminResponse: 'Pay the enrollment deposit first; CMU issues the I-20 within ~5 business days after.' });

    console.log('10. onboarding tasks ...');
    const addTask = async (t) => {
      await q(
        `insert into onboarding_tasks
          (prospect_name, prospect_email, phone, source, status, student_id,
           assigned_admin_id, intake_token, login_link, emails_log, last_contact_at, next_follow_up)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [t.name, t.email, t.phone, t.source, t.status, t.studentId || null,
         uid[t.admin], t.intakeToken || null, t.loginLink || null,
         JSON.stringify(t.emails || []), t.lastContact || null, t.nextFollowUp || null]
      );
    };
    const emailRec = (subject, tmpl) => ({ subject, template: tmpl, sent_at: now, note: 'recorded only — not delivered' });
    for (const s of STUDENTS) {
      const map = {
        FORM_SENT: 'FORM_SENT', SUBMITTED: 'SUBMITTED', ACTIVE: 'COMPLETED',
      };
      await addTask({
        name: s.full_name, email: s.email, phone: s.phone, source: 'manual',
        status: map[s.stage] || 'ACCOUNT_CREATED',
        studentId: uid[s.email], admin: s.admin,
        intakeToken: s.stage === 'FORM_SENT' || s.stage === 'SUBMITTED' || s.stage === 'ACTIVE'
          ? `intake_${s.email.split('@')[0]}` : null,
        loginLink: `${ENV.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/login?email=${encodeURIComponent(s.email)}`,
        emails: s.stage === 'FORM_SENT'
          ? [emailRec('Welcome to RBOE', 'welcome'), emailRec('Complete your profile', 'intake_form')]
          : s.stage === 'ACCOUNT_CREATED' ? [emailRec('Welcome to RBOE', 'welcome')]
          : [emailRec('Welcome to RBOE', 'welcome'), emailRec('Complete your profile', 'intake_form'), emailRec('Onboarding complete', 'onboarding_done')],
        lastContact: now,
        nextFollowUp: s.stage === 'FORM_SENT' ? '2026-09-08' : null,
      });
    }
    await addTask({
      name: BOOKING_PROSPECT.prospect_name, email: BOOKING_PROSPECT.prospect_email,
      phone: BOOKING_PROSPECT.phone, source: 'booking', status: 'INVITED',
      admin: BOOKING_PROSPECT.admin, nextFollowUp: '2026-09-05',
      emails: [],
    });

    console.log('11. outreach log ...');
    const addOutreach = async (o) => {
      await q(
        `insert into outreach_log (alumni_id, student_id, admin_id, channel, purpose, message, outcome, status, logged_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [alumniId[o.alumni], o.studentEmail ? uid[o.studentEmail] : null, uid[o.admin],
         o.channel, o.purpose, o.message, o.outcome || null, o.status, o.loggedAt || now]
      );
    };
    await addOutreach({ alumni: 'Rajesh Kumar', studentEmail: 'priya@student.com', admin: 'rajiv@rboe.com',
      channel: 'linkedin', purpose: 'Stanford CS program insights for Priya',
      message: 'Intro requested — Priya is applying to Stanford CS, wants to hear about systems groups.',
      outcome: 'Call happened; Priya has 3 faculty to name in her SOP.', status: 'CONNECTED' });
    await addOutreach({ alumni: 'Priyanka Mehta', studentEmail: 'arjun@student.com', admin: 'rajiv@rboe.com',
      channel: 'email', purpose: 'MIT program experience', message: 'Asked Priyanka if she can share MIT EECS MS reality vs PhD track.',
      status: 'CONTACTED' });
    await addOutreach({ alumni: 'Ankit Desai', studentEmail: 'sneha@student.com', admin: 'neha@rboe.com',
      channel: 'phone', purpose: 'CMU housing + first-month logistics',
      message: 'Sneha accepted CMU. Ankit shared Oakland housing group + bank account tips.',
      outcome: 'Sneha has a housing lead and a checklist.', status: 'CLOSED' });
    await addOutreach({ alumni: 'Sara Thomas', admin: 'sameer@rboe.com',
      channel: 'email', purpose: 'Refresh Georgia Tech tips for the incoming batch',
      message: 'Requested updated GRA/GTA and housing notes for Fall 2026 intake.', status: 'LOGGED' });
    await addOutreach({ alumni: 'Rahul Nair', studentEmail: 'vikram@student.com', admin: 'sameer@rboe.com',
      channel: 'linkedin', purpose: 'Berkeley RA opportunities',
      message: 'Vikram is considering Berkeley MEng. Asked Rahul about research funding routes.', status: 'LOGGED' });

    console.log('12. visa mock interviews ...');
    const addVisa = async (v) => {
      await q(
        `insert into visa_mock_interviews
          (student_id, application_id, university_name, intended_start_date, visa_slot_date,
           notes, status, scheduled_at, interviewer, meeting_link, student_notified, feedback, requested_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [uid[v.email], v.applicationId || null, v.university, v.intendedStart || null, v.slotDate || null,
         v.notes || null, v.status, v.scheduledAt || null, v.interviewer || 'Rajiv',
         v.meetingLink || null, v.notified || false, v.feedback || null, v.requestedAt || now]
      );
    };
    await addVisa({ email: 'arjun@student.com', applicationId: app.arjunASU, university: 'Arizona State University',
      intendedStart: '2026-08-20', slotDate: '2026-09-22', status: 'REQUESTED',
      notes: 'F-1 interview at Mumbai consulate. First attempt.' });
    await addVisa({ email: 'sneha@student.com', applicationId: app.snehaCMU, university: 'Carnegie Mellon University',
      intendedStart: '2026-08-25', slotDate: '2026-08-12', status: 'COMPLETED',
      scheduledAt: '2026-08-08T10:00:00Z', interviewer: 'Rajiv',
      meetingLink: 'https://meet.google.com/demo-sneha-visa', notified: true,
      feedback: 'Strong on funding and academic intent. Practice the "ties to home country" answer and keep it under 30 seconds.' });
    await addVisa({ email: 'priya@student.com', applicationId: app.priyaStanford, university: 'Stanford University',
      intendedStart: '2026-09-15', slotDate: '2026-10-05', status: 'SCHEDULED',
      scheduledAt: '2026-09-25T09:30:00Z', interviewer: 'Rajiv',
      meetingLink: 'https://meet.google.com/demo-priya-visa', notified: true,
      notes: 'Second mock — first one flagged nervous pacing.' });
    await addVisa({ email: 'vikram@student.com', university: 'Georgia Institute of Technology',
      status: 'REQUESTED', notes: 'No I-20 yet; requesting early so a slot is held.' });
  });

  // -------------------------------------------------------------------------
  writeCredentials();
  console.log('\n✅ seed complete.');
}

function writeCredentials() {
  const lines = [
    '# Demo Credentials (gitignored)',
    '',
    `All accounts use the password: \`${PASSWORD}\``,
    '',
    '## Admins',
    '| Name | Email | Role |',
    '|---|---|---|',
    ...ADMINS.map((a) => `| ${a.full_name} | ${a.email} | ${a.title} |`),
    '',
    '## Students',
    '| Name | Email | Onboarding stage | Assigned admin |',
    '|---|---|---|---|',
    ...STUDENTS.map((s) => `| ${s.full_name} | ${s.email} | ${s.stage} | ${s.admin} |`),
    '',
    '## Booking-only prospect (no account)',
    `- ${BOOKING_PROSPECT.prospect_name} <${BOOKING_PROSPECT.prospect_email}> — appears in the admin onboarding queue as INVITED`,
    '',
    `_Regenerate with_ \`node scripts/seed-demo.mjs\``,
    '',
  ];
  fs.writeFileSync(path.join(ROOT, 'DEMO_CREDENTIALS.md'), lines.join('\n'));
  console.log('  wrote DEMO_CREDENTIALS.md');
}

main().catch((e) => {
  console.error('\n❌ seed failed:', e);
  process.exit(1);
});
