import { NextRequest, NextResponse } from "next/server";
import { requireUser, HttpError } from "@/lib/supabase-server";

/**
 * GET  /api/student/visa  — the caller's mock interview requests
 * POST /api/student/visa  — request a new mock interview
 */
export async function GET() {
  try {
    const { user, supabase } = await requireUser();
    const { data, error } = await supabase
      .from("visa_mock_interviews")
      .select("*")
      .eq("student_id", user.id)
      .order("requested_at", { ascending: false });
    if (error) {
      console.error("student visa GET:", error);
      return NextResponse.json({ error: "Failed to load visa interviews" }, { status: 500 });
    }
    return NextResponse.json(data || []);
  } catch (error) {
    if (error instanceof HttpError) return error.toResponse();
    console.error("student visa GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await requireUser();
    const body = (await request.json()) as {
      application_id?: string;
      university_name?: string;
      intended_start_date?: string;
      visa_slot_date?: string;
      notes?: string;
    };

    if (!body.university_name?.trim()) {
      return NextResponse.json({ error: "University is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("visa_mock_interviews")
      .insert({
        student_id: user.id,
        application_id: body.application_id || null,
        university_name: body.university_name.trim(),
        intended_start_date: body.intended_start_date || null,
        visa_slot_date: body.visa_slot_date || null,
        notes: body.notes?.trim() || null,
        status: "REQUESTED",
      })
      .select()
      .single();
    if (error) {
      console.error("student visa POST:", error);
      return NextResponse.json({ error: "Failed to request the mock interview" }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof HttpError) return error.toResponse();
    console.error("student visa POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
