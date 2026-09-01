import { NextResponse } from "next/server";
import { requireAdmin, HttpError } from "@/lib/supabase-server";

/**
 * GET /api/admin/visa — every mock interview, joined with the student's name,
 * ordered so the soonest visa slot is first (REQUESTED before others).
 */
export async function GET() {
  try {
    const { supabase } = await requireAdmin();

    const { data, error } = await supabase
      .from("visa_mock_interviews")
      .select(
        `*, profiles!visa_mock_interviews_student_id_fkey ( full_name, phone )`
      )
      .order("visa_slot_date", { ascending: true, nullsFirst: false })
      .order("requested_at", { ascending: true });
    if (error) {
      console.error("admin visa GET:", error);
      return NextResponse.json({ error: "Failed to load visa interviews" }, { status: 500 });
    }

    return NextResponse.json(
      (data || []).map((r) => ({
        ...r,
        student_name: r.profiles?.full_name ?? "Student",
        student_phone: r.profiles?.phone ?? null,
      }))
    );
  } catch (error) {
    if (error instanceof HttpError) return error.toResponse();
    console.error("admin visa GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
