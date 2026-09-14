import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, HttpError } from "@/lib/supabase-server";

/**
 * GET  /api/admin/onboarding  — list onboarding tasks (+ the linked student's
 *                               current onboarding_stage / academic snapshot)
 * POST /api/admin/onboarding  — create a task for a new prospect
 */
export async function GET() {
  try {
    const { supabase } = await requireAdmin();

    const { data: tasks, error } = await supabase
      .from("onboarding_tasks")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("onboarding list:", error);
      return NextResponse.json({ error: "Failed to load onboarding tasks" }, { status: 500 });
    }

    const studentIds = (tasks || []).map((t) => t.student_id).filter(Boolean) as string[];
    let profileById: Record<string, Record<string, unknown>> = {};
    if (studentIds.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select(
          "user_id, full_name, onboarding_stage, gre_score, toefl_score, undergrad_gpa, work_experience_months, undergrad_college, publications, target_degree, target_intake, intake_submitted_at, intake_data, assigned_admin_id"
        )
        .in("user_id", studentIds);
      profileById = Object.fromEntries((profiles || []).map((p) => [p.user_id, p]));
    }

    const { data: admins } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .eq("role", "ADMIN");
    const adminName = Object.fromEntries((admins || []).map((a) => [a.user_id, a.full_name]));

    // The student's profile.onboarding_stage is the source of truth for the
    // stage (the student can advance it by submitting the intake form, but RLS
    // stops them writing the task row). Derive the displayed status from it.
    const fromStage = (stage: unknown): string | null => {
      if (stage === "ACTIVE") return "COMPLETED";
      if (typeof stage === "string" && stage) return stage;
      return null;
    };

    return NextResponse.json(
      (tasks || []).map((t) => {
        const profile = t.student_id ? profileById[t.student_id] ?? null : null;
        const derived = profile ? fromStage(profile.onboarding_stage) : null;
        return {
          ...t,
          status: derived ?? t.status,
          assigned_admin_name: t.assigned_admin_id ? adminName[t.assigned_admin_id] ?? null : null,
          profile,
        };
      })
    );
  } catch (error) {
    if (error instanceof HttpError) return error.toResponse();
    console.error("onboarding GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await requireAdmin();
    const body = (await request.json()) as {
      prospect_name?: string;
      prospect_email?: string;
      phone?: string;
      assigned_admin_id?: string;
      invite_note?: string;
      next_follow_up?: string;
    };

    if (!body.prospect_name?.trim() || !body.prospect_email?.trim()) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("onboarding_tasks")
      .insert({
        prospect_name: body.prospect_name.trim(),
        prospect_email: body.prospect_email.trim().toLowerCase(),
        phone: body.phone?.trim() || null,
        source: "manual",
        status: "INVITED",
        assigned_admin_id: body.assigned_admin_id || user.id,
        invite_note: body.invite_note?.trim() || null,
        next_follow_up: body.next_follow_up || null,
      })
      .select()
      .single();

    if (error) {
      console.error("onboarding create:", error);
      return NextResponse.json({ error: "Failed to create onboarding task" }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof HttpError) return error.toResponse();
    console.error("onboarding POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
