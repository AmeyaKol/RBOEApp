import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, HttpError } from "@/lib/supabase-server";

const SCALARS = [
  "name",
  "location",
  "country",
  "website",
  "us_news_rank",
  "cs_rank",
  "research_status",
  "overview",
  "tuition_per_year",
  "living_cost_per_year",
  "application_fee",
] as const;
const JSONB = ["programs", "deadlines", "requirements", "sources"] as const;

/**
 * GET  /api/admin/universities — the research directory
 * POST /api/admin/universities — add a university
 * PUT  /api/admin/universities — save research for one (id in body)
 */
export async function GET() {
  try {
    const { supabase } = await requireAdmin();
    const { data, error } = await supabase
      .from("universities")
      .select("*")
      .order("us_news_rank", { ascending: true, nullsFirst: false })
      .order("name", { ascending: true });
    if (error) {
      console.error("universities GET:", error);
      return NextResponse.json({ error: "Failed to load universities" }, { status: 500 });
    }
    return NextResponse.json(data || []);
  } catch (error) {
    if (error instanceof HttpError) return error.toResponse();
    console.error("universities GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function pickBody(body: Record<string, unknown>) {
  const row: Record<string, unknown> = {};
  for (const k of SCALARS) if (body[k] !== undefined) row[k] = body[k] === "" ? null : body[k];
  for (const k of JSONB) if (body[k] !== undefined) row[k] = body[k];
  return row;
}

export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await requireAdmin();
    const body = (await request.json()) as Record<string, unknown>;
    if (!String(body.name || "").trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const row = { ...pickBody(body), researched_by: user.id };
    const { data, error } = await supabase.from("universities").insert(row).select().single();
    if (error) {
      console.error("universities POST:", error);
      return NextResponse.json({ error: "Failed to add university" }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof HttpError) return error.toResponse();
    console.error("universities POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user, supabase } = await requireAdmin();
    const body = (await request.json()) as Record<string, unknown> & { id?: string };
    if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const patch = { ...pickBody(body), researched_by: user.id };
    const { data, error } = await supabase
      .from("universities")
      .update(patch)
      .eq("id", body.id)
      .select()
      .single();
    if (error) {
      console.error("universities PUT:", error);
      return NextResponse.json({ error: "Failed to save research" }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof HttpError) return error.toResponse();
    console.error("universities PUT:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
