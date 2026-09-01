import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, HttpError } from "@/lib/supabase-server";

const FIELDS = [
  "full_name",
  "email",
  "phone",
  "linkedin_url",
  "grad_year",
  "university",
  "program",
  "job_title",
  "company",
  "location",
  "status",
  "tips",
  "notes",
] as const;

/**
 * GET  /api/admin/alumni  — the alumni directory (+ connection counts)
 * POST /api/admin/alumni  — add an alumnus
 */
export async function GET() {
  try {
    const { supabase } = await requireAdmin();
    const { data, error } = await supabase
      .from("alumni")
      .select("*")
      .order("full_name", { ascending: true });
    if (error) {
      console.error("alumni GET:", error);
      return NextResponse.json({ error: "Failed to load alumni" }, { status: 500 });
    }

    const { data: counts } = await supabase.from("outreach_log").select("alumni_id, status");
    const byAlumni: Record<string, { total: number; connected: number }> = {};
    for (const c of counts || []) {
      const b = (byAlumni[c.alumni_id] ??= { total: 0, connected: 0 });
      b.total += 1;
      if (c.status === "CONNECTED" || c.status === "CLOSED") b.connected += 1;
    }

    return NextResponse.json(
      (data || []).map((a) => ({
        ...a,
        outreach_total: byAlumni[a.id]?.total ?? 0,
        outreach_connected: byAlumni[a.id]?.connected ?? 0,
      }))
    );
  } catch (error) {
    if (error instanceof HttpError) return error.toResponse();
    console.error("alumni GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await requireAdmin();
    const body = (await request.json()) as Record<string, unknown>;
    if (!String(body.full_name || "").trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const row: Record<string, unknown> = { created_by: user.id };
    for (const f of FIELDS) if (body[f] !== undefined) row[f] = body[f] === "" ? null : body[f];

    const { data, error } = await supabase.from("alumni").insert(row).select().single();
    if (error) {
      console.error("alumni POST:", error);
      return NextResponse.json({ error: "Failed to add alumnus" }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof HttpError) return error.toResponse();
    console.error("alumni POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin();
    const body = (await request.json()) as Record<string, unknown> & { id?: string };
    if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const patch: Record<string, unknown> = {};
    for (const f of FIELDS) if (body[f] !== undefined) patch[f] = body[f] === "" ? null : body[f];
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("alumni")
      .update(patch)
      .eq("id", body.id)
      .select()
      .single();
    if (error) {
      console.error("alumni PUT:", error);
      return NextResponse.json({ error: "Failed to update alumnus" }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof HttpError) return error.toResponse();
    console.error("alumni PUT:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
