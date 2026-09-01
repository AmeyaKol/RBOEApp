import { NextResponse } from "next/server";
import { requireAdmin, HttpError } from "@/lib/supabase-server";
import { buildAdminActivity } from "@/lib/admin-activity";

/**
 * GET /api/admin/activity-log — the full reverse-chronological feed of recent
 * request, document, and application changes across the caller's students.
 * The dashboard shows a short slice of the same feed.
 */
export async function GET() {
  try {
    const { supabase } = await requireAdmin();
    const items = await buildAdminActivity(supabase, 60);
    return NextResponse.json({ items });
  } catch (error) {
    if (error instanceof HttpError) return error.toResponse();
    console.error("admin activity-log GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
