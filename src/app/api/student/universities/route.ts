import { NextRequest, NextResponse } from "next/server";
import { requireUser, HttpError } from "@/lib/supabase-server";

/**
 * GET /api/student/universities        — all admin-verified research
 * GET /api/student/universities?name=… — research for one university (used on
 *                                        the application card)
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireUser();
    const name = new URL(request.url).searchParams.get("name");

    let query = supabase
      .from("universities")
      .select(
        "id, name, location, country, website, us_news_rank, cs_rank, research_status, overview, tuition_per_year, living_cost_per_year, application_fee, programs, deadlines, requirements, sources, updated_at"
      );
    if (name) query = query.ilike("name", name);
    else query = query.order("us_news_rank", { ascending: true, nullsFirst: false });

    const { data, error } = await query;
    if (error) {
      console.error("student universities GET:", error);
      return NextResponse.json({ error: "Failed to load university research" }, { status: 500 });
    }
    return NextResponse.json(name ? (data?.[0] ?? null) : data || []);
  } catch (error) {
    if (error instanceof HttpError) return error.toResponse();
    console.error("student universities GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
