import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, HttpError } from "@/lib/supabase-server";

/**
 * Outreach log — a record of who reached out to which alumnus, why, and how it
 * went. This never sends anything; it is a logbook only.
 *
 * GET  /api/admin/outreach  — all entries (joined alumni + student names)
 * POST /api/admin/outreach  — log a new outreach
 * PUT  /api/admin/outreach  — advance status / edit outcome
 */
export async function GET() {
  try {
    const { supabase } = await requireAdmin();
    const { data, error } = await supabase
      .from("outreach_log")
      .select(
        `*,
         alumni ( full_name, university, company ),
         profiles!outreach_log_student_id_fkey ( full_name )`
      )
      .order("logged_at", { ascending: false });
    if (error) {
      console.error("outreach GET:", error);
      return NextResponse.json({ error: "Failed to load the outreach log" }, { status: 500 });
    }
    return NextResponse.json(
      (data || []).map((r) => ({
        ...r,
        alumni_name: r.alumni?.full_name ?? "Alumnus",
        alumni_university: r.alumni?.university ?? null,
        alumni_company: r.alumni?.company ?? null,
        student_name: r.profiles?.full_name ?? null,
      }))
    );
  } catch (error) {
    if (error instanceof HttpError) return error.toResponse();
    console.error("outreach GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await requireAdmin();
    const body = (await request.json()) as {
      alumni_id?: string;
      student_id?: string;
      channel?: string;
      purpose?: string;
      message?: string;
      outcome?: string;
      status?: string;
    };
    if (!body.alumni_id) {
      return NextResponse.json({ error: "Pick an alumnus" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("outreach_log")
      .insert({
        alumni_id: body.alumni_id,
        student_id: body.student_id || null,
        admin_id: user.id,
        channel: body.channel || null,
        purpose: body.purpose || null,
        message: body.message || null,
        outcome: body.outcome || null,
        status: body.status || "LOGGED",
      })
      .select()
      .single();
    if (error) {
      console.error("outreach POST:", error);
      return NextResponse.json({ error: "Failed to log the outreach" }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof HttpError) return error.toResponse();
    console.error("outreach POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin();
    const body = (await request.json()) as {
      id?: string;
      status?: string;
      outcome?: string;
    };
    if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const patch: Record<string, unknown> = {};
    if (body.status) patch.status = body.status;
    if (body.outcome !== undefined) patch.outcome = body.outcome || null;
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("outreach_log")
      .update(patch)
      .eq("id", body.id)
      .select()
      .single();
    if (error) {
      console.error("outreach PUT:", error);
      return NextResponse.json({ error: "Failed to update the entry" }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof HttpError) return error.toResponse();
    console.error("outreach PUT:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
