import { NextRequest, NextResponse } from "next/server";
import { requireUser, HttpError } from "@/lib/supabase-server";

const INTAKE_FIELDS = [
  "gre_score",
  "toefl_score",
  "undergrad_gpa",
  "work_experience_months",
  "undergrad_college",
  "publications",
  "target_degree",
  "target_intake",
] as const;

/**
 * GET  /api/student/onboarding  — the caller's onboarding stage + intake snapshot
 * POST /api/student/onboarding  — submit the intake form
 */
export async function GET() {
  try {
    const { user, supabase } = await requireUser();

    const { data: profile, error } = await supabase
      .from("profiles")
      .select(
        "full_name, onboarding_stage, intake_submitted_at, intake_data, " +
          INTAKE_FIELDS.join(", ")
      )
      .eq("user_id", user.id)
      .single();
    if (error) {
      console.error("student onboarding GET:", error);
      return NextResponse.json({ error: "Failed to load onboarding" }, { status: 500 });
    }

    const { data: task } = await supabase
      .from("onboarding_tasks")
      .select("status, intake_token, next_follow_up")
      .eq("student_id", user.id)
      .maybeSingle();

    return NextResponse.json({ profile, task: task ?? null });
  } catch (error) {
    if (error instanceof HttpError) return error.toResponse();
    console.error("student onboarding GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await requireUser();
    const body = (await request.json()) as Record<string, unknown> & { notes?: string };

    const num = (v: unknown) =>
      v === "" || v === null || v === undefined ? null : Number(v);

    const gre = num(body.gre_score);
    const toefl = num(body.toefl_score);
    const gpa = num(body.undergrad_gpa);
    const yoe = num(body.work_experience_months);
    const pubs = num(body.publications) ?? 0;

    if (gre !== null && (gre < 260 || gre > 340))
      return NextResponse.json({ error: "GRE must be between 260 and 340" }, { status: 400 });
    if (toefl !== null && (toefl < 0 || toefl > 120))
      return NextResponse.json({ error: "TOEFL must be between 0 and 120" }, { status: 400 });
    if (gpa !== null && (gpa < 0 || gpa > 4))
      return NextResponse.json({ error: "GPA must be between 0.0 and 4.0" }, { status: 400 });
    if (yoe !== null && yoe < 0)
      return NextResponse.json({ error: "Work experience cannot be negative" }, { status: 400 });

    const intakeData = {
      gre_score: gre,
      toefl_score: toefl,
      undergrad_gpa: gpa,
      work_experience_months: yoe,
      undergrad_college: (body.undergrad_college as string) || null,
      publications: pubs,
      target_degree: (body.target_degree as string) || null,
      target_intake: (body.target_intake as string) || null,
      notes: (body.notes as string) || null,
      submitted_at: new Date().toISOString(),
    };

    const { data: profile, error } = await supabase
      .from("profiles")
      .update({
        gre_score: gre,
        toefl_score: toefl,
        undergrad_gpa: gpa,
        work_experience_months: yoe,
        undergrad_college: intakeData.undergrad_college,
        publications: pubs,
        target_degree: intakeData.target_degree,
        target_intake: intakeData.target_intake,
        onboarding_stage: "SUBMITTED",
        intake_submitted_at: intakeData.submitted_at,
        intake_data: intakeData,
      })
      .eq("user_id", user.id)
      .select()
      .single();
    if (error) {
      console.error("student onboarding POST:", error);
      return NextResponse.json({ error: "Failed to submit your details" }, { status: 500 });
    }

    // advance any onboarding task the admin opened for this student
    await supabase
      .from("onboarding_tasks")
      .update({ status: "SUBMITTED" })
      .eq("student_id", user.id)
      .in("status", ["INVITED", "ACCOUNT_CREATED", "FORM_SENT"]);

    return NextResponse.json({ profile });
  } catch (error) {
    if (error instanceof HttpError) return error.toResponse();
    console.error("student onboarding POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
