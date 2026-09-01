import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, HttpError } from "@/lib/supabase-server";

/**
 * GET /api/admin/students/[userId] — full student record (profile + applications
 *                                    + requests + documents)
 * PUT /api/admin/students/[userId] — admin edits the student's profile
 */

const EDITABLE = new Set([
  "full_name",
  "phone",
  "gre_score",
  "toefl_score",
  "undergrad_gpa",
  "work_experience_months",
  "undergrad_college",
  "publications",
  "target_degree",
  "target_intake",
  "onboarding_stage",
  "assigned_admin_id",
]);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { supabase } = await requireAdmin();
    const { userId } = await params;

    const { data: studentProfile, error: studentError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .eq("role", "STUDENT")
      .single();
    if (studentError || !studentProfile) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const [{ data: applications }, { data: requests }, { data: documents }] = await Promise.all([
      supabase.from("applications").select("*").eq("student_id", userId).order("created_at", { ascending: false }),
      supabase.from("requests").select("*").eq("student_id", userId).order("created_at", { ascending: false }),
      supabase
        .from("documents")
        .select("id, type, title, content, is_master, version, updated_at")
        .eq("student_id", userId)
        .order("is_master", { ascending: false })
        .order("updated_at", { ascending: false }),
    ]);

    return NextResponse.json({
      ...studentProfile,
      applications: applications || [],
      requests: requests || [],
      documents: documents || [],
    });
  } catch (error) {
    if (error instanceof HttpError) return error.toResponse();
    console.error("admin student GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { supabase } = await requireAdmin();
    const { userId } = await params;
    const body = (await request.json()) as Record<string, unknown>;

    const updates: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(body)) {
      if (EDITABLE.has(k)) updates[k] = v === "" ? null : v;
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No editable fields provided" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", userId)
      .eq("role", "STUDENT")
      .select()
      .single();
    if (error) {
      console.error("admin student PUT:", error);
      return NextResponse.json({ error: "Failed to update the student" }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof HttpError) return error.toResponse();
    console.error("admin student PUT:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
