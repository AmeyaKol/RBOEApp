import { NextResponse } from "next/server";
import { requireAdmin, HttpError } from "@/lib/supabase-server";

export type CalendarItemKind = "deadline" | "visa";

/** Supabase may embed a to-one relation as an object or a single-element array. */
type NameRel = { full_name: string | null } | { full_name: string | null }[] | null | undefined;
const relName = (p: NameRel, fallback = "Student"): string => {
  const row = Array.isArray(p) ? p[0] : p;
  return row?.full_name || fallback;
};

export interface CalendarItem {
  kind: CalendarItemKind;
  /** ISO date (YYYY-MM-DD) the item falls on */
  date: string;
  /** ISO timestamp when a specific time is known (visa mock), else null */
  at: string | null;
  title: string;
  subtitle: string | null;
  studentId: string | null;
  studentName: string;
  status: string | null;
}

/**
 * GET /api/admin/calendar — application deadlines and visa mock interview slots
 * across the caller's students, as a flat date-sorted list. No month-grid data;
 * the page groups by date.
 */
export async function GET() {
  try {
    const { supabase } = await requireAdmin();

    const [apps, visa] = await Promise.all([
      supabase
        .from("applications")
        .select(
          "id, deadline, university_name, program_name, status, student_id, profiles!applications_student_id_fkey ( full_name )"
        )
        .not("deadline", "is", null)
        .order("deadline", { ascending: true }),
      supabase
        .from("visa_mock_interviews")
        .select(
          "id, visa_slot_date, scheduled_at, university_name, status, student_id, profiles!visa_mock_interviews_student_id_fkey ( full_name )"
        ),
    ]);

    if (apps.error) {
      console.error("admin calendar (applications):", apps.error);
      return NextResponse.json({ error: "Failed to load deadlines" }, { status: 500 });
    }
    if (visa.error) {
      console.error("admin calendar (visa):", visa.error);
      return NextResponse.json({ error: "Failed to load visa slots" }, { status: 500 });
    }

    const items: CalendarItem[] = [];

    for (const a of apps.data || []) {
      items.push({
        kind: "deadline",
        date: String(a.deadline).slice(0, 10),
        at: null,
        title: `${a.university_name} — application deadline`,
        subtitle: a.program_name || null,
        studentId: a.student_id ?? null,
        studentName: relName(a.profiles),
        status: a.status ?? null,
      });
    }

    for (const v of visa.data || []) {
      // Prefer the scheduled mock datetime; fall back to the visa appointment date.
      const when = v.scheduled_at || v.visa_slot_date;
      if (!when) continue;
      const isTimed = Boolean(v.scheduled_at);
      items.push({
        kind: "visa",
        date: String(when).slice(0, 10),
        at: isTimed ? new Date(v.scheduled_at as string).toISOString() : null,
        title: isTimed
          ? "Visa mock interview"
          : "Visa appointment (student's real slot)",
        subtitle: v.university_name || null,
        studentId: v.student_id ?? null,
        studentName: relName(v.profiles),
        status: v.status ?? null,
      });
    }

    items.sort((x, y) => {
      if (x.date !== y.date) return x.date < y.date ? -1 : 1;
      return (x.at || "") < (y.at || "") ? -1 : 1;
    });

    return NextResponse.json({ items });
  } catch (error) {
    if (error instanceof HttpError) return error.toResponse();
    console.error("admin calendar GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
