import type { SupabaseClient } from "@supabase/supabase-js";

/** Supabase may embed a to-one relation as an object or a single-element array. */
type NameRel = { full_name: string | null } | { full_name: string | null }[] | null | undefined;
const relName = (p: NameRel, fallback = "A student"): string => {
  const row = Array.isArray(p) ? p[0] : p;
  return row?.full_name || fallback;
};

export type AdminActivityKind = "request" | "document" | "application";

export interface AdminActivityItem {
  kind: AdminActivityKind;
  text: string;
  detail: string;
  at: string;
  /** student the activity belongs to, for linking to their profile */
  studentId: string | null;
}

/**
 * Build a reverse-chronological activity feed from the most recent request,
 * document, and application changes across all students. Shared by the admin
 * dashboard (short slice) and the full activity log.
 */
export async function buildAdminActivity(
  supabase: SupabaseClient,
  limit = 40
): Promise<AdminActivityItem[]> {
  const perSource = Math.max(limit, 12);

  const [requests, documents, applications] = await Promise.all([
    supabase
      .from("requests")
      .select(
        "id, title, is_urgent, status, created_at, student_id, profiles!requests_student_id_fkey ( full_name )"
      )
      .order("created_at", { ascending: false })
      .limit(perSource),
    supabase
      .from("documents")
      .select(
        "id, title, type, updated_at, student_id, profiles!documents_student_id_fkey ( full_name )"
      )
      .order("updated_at", { ascending: false })
      .limit(perSource),
    supabase
      .from("applications")
      .select(
        "id, university_name, status, updated_at, student_id, profiles!applications_student_id_fkey ( full_name )"
      )
      .order("updated_at", { ascending: false })
      .limit(perSource),
  ]);

  const items: AdminActivityItem[] = [];

  for (const r of requests.data || []) {
    items.push({
      kind: "request",
      text: `${relName(r.profiles)} — ${r.title}`,
      detail: r.is_urgent ? "Urgent request" : "New request",
      at: r.created_at,
      studentId: r.student_id ?? null,
    });
  }
  for (const d of documents.data || []) {
    items.push({
      kind: "document",
      text: `${relName(d.profiles)} updated ${d.title}`,
      detail: `${d.type} document`,
      at: d.updated_at,
      studentId: d.student_id ?? null,
    });
  }
  for (const a of applications.data || []) {
    items.push({
      kind: "application",
      text: `${relName(a.profiles)} — ${a.university_name}`,
      detail: `Application ${String(a.status).toLowerCase()}`,
      at: a.updated_at,
      studentId: a.student_id ?? null,
    });
  }

  items.sort((x, y) => new Date(y.at).getTime() - new Date(x.at).getTime());
  return items.slice(0, limit);
}
