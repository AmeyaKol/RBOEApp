import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, HttpError } from "@/lib/supabase-server";

/**
 * PUT /api/admin/documents/[id]
 *   { content, version_note?, title?, resolve_request_id?, resolve_status? }
 *
 * Snapshots the current document text into document_versions, then bumps the
 * live document to a new version with the edited content. Optionally closes a
 * linked document-edit request in the same call.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, profile, supabase } = await requireAdmin();
    const { id } = await params;
    const body = (await request.json()) as {
      content?: string;
      title?: string;
      version_note?: string;
      resolve_request_id?: string;
      resolve_status?: "IN_PROGRESS" | "CLOSED";
    };

    if (typeof body.content !== "string") {
      return NextResponse.json({ error: "content is required" }, { status: 400 });
    }

    const { data: current, error: fetchErr } = await supabase
      .from("documents")
      .select("id, content, version, title")
      .eq("id", id)
      .single();
    if (fetchErr || !current) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const contentChanged = (current.content ?? "") !== body.content;
    const nextVersion = contentChanged ? (current.version ?? 1) + 1 : current.version ?? 1;

    // Snapshot the version we're about to supersede.
    if (contentChanged) {
      const { error: snapErr } = await supabase.from("document_versions").insert({
        document_id: id,
        version: current.version ?? 1,
        content: current.content ?? "",
        version_note: body.version_note?.trim() || null,
        edited_by: user.id,
        editor_name: profile.full_name,
        editor_role: "ADMIN",
      });
      if (snapErr) {
        console.error("admin document version snapshot:", snapErr);
        return NextResponse.json({ error: "Failed to snapshot the current version" }, { status: 500 });
      }
    }

    const { data: updated, error: updErr } = await supabase
      .from("documents")
      .update({
        content: body.content,
        version: nextVersion,
        ...(body.title ? { title: body.title } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
    if (updErr) {
      console.error("admin document update:", updErr);
      return NextResponse.json({ error: "Failed to save the document" }, { status: 500 });
    }

    let resolvedRequest = null;
    if (body.resolve_request_id) {
      const status = body.resolve_status || "CLOSED";
      const { data: req, error: reqErr } = await supabase
        .from("requests")
        .update({
          status,
          admin_id: user.id,
          ...(status === "CLOSED"
            ? {
                admin_response: `Edited "${updated.title}" — saved as v${nextVersion}. See the document and comments.`,
                responded_at: new Date().toISOString(),
              }
            : {}),
          updated_at: new Date().toISOString(),
        })
        .eq("id", body.resolve_request_id)
        .select("id, status")
        .single();
      if (reqErr) console.error("resolve linked request:", reqErr);
      else resolvedRequest = req;
    }

    return NextResponse.json({ document: updated, version: nextVersion, resolvedRequest });
  } catch (error) {
    if (error instanceof HttpError) return error.toResponse();
    console.error("admin document PUT:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
