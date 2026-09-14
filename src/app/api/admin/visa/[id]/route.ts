import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, HttpError } from "@/lib/supabase-server";

/**
 * PUT /api/admin/visa/[id] — schedule, reschedule, complete, or cancel a mock
 * interview. Scheduling and notification only; the interview itself runs on
 * whatever meeting link the admin pastes.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase } = await requireAdmin();
    const { id } = await params;
    const body = (await request.json()) as {
      status?: "REQUESTED" | "SCHEDULED" | "COMPLETED" | "CANCELLED";
      scheduled_at?: string;
      interviewer?: string;
      meeting_link?: string;
      feedback?: string;
      student_notified?: boolean;
      visa_slot_date?: string;
    };

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.status) update.status = body.status;
    if (body.scheduled_at !== undefined) update.scheduled_at = body.scheduled_at || null;
    if (body.interviewer !== undefined) update.interviewer = body.interviewer || "Rajiv";
    if (body.meeting_link !== undefined) update.meeting_link = body.meeting_link || null;
    if (body.feedback !== undefined) update.feedback = body.feedback || null;
    if (body.visa_slot_date !== undefined) update.visa_slot_date = body.visa_slot_date || null;
    if (typeof body.student_notified === "boolean") update.student_notified = body.student_notified;

    // Scheduling implies notifying the student in this demo.
    if (body.status === "SCHEDULED" && body.student_notified === undefined) {
      update.student_notified = true;
    }

    const { data, error } = await supabase
      .from("visa_mock_interviews")
      .update(update)
      .eq("id", id)
      .select(`*, profiles!visa_mock_interviews_student_id_fkey ( full_name )`)
      .single();
    if (error) {
      console.error("admin visa PUT:", error);
      return NextResponse.json({ error: "Failed to update the interview" }, { status: 500 });
    }
    return NextResponse.json({ ...data, student_name: data.profiles?.full_name ?? "Student" });
  } catch (error) {
    if (error instanceof HttpError) return error.toResponse();
    console.error("admin visa PUT:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
