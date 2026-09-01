import { NextRequest, NextResponse } from "next/server";
import { requireUser, HttpError } from "@/lib/supabase-server";

/**
 * GET /api/documents/[id]/versions — superseded versions of a document, newest
 * first. RLS on document_versions already scopes this to the owning student and
 * to admins, so any authenticated caller is fine here.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase } = await requireUser();
    const { id } = await params;

    const { data, error } = await supabase
      .from("document_versions")
      .select("id, version, content, version_note, editor_name, editor_role, created_at")
      .eq("document_id", id)
      .order("version", { ascending: false });
    if (error) {
      console.error("versions GET:", error);
      return NextResponse.json({ error: "Failed to load version history" }, { status: 500 });
    }
    return NextResponse.json(data || []);
  } catch (error) {
    if (error instanceof HttpError) return error.toResponse();
    console.error("versions GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
