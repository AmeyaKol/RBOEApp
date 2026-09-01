export type RequestStatus = "OPEN" | "IN_PROGRESS" | "CLOSED";

/** How the student framed the request. Derived, not stored. */
export type RequestLinkKind = "document" | "application" | "general";

export interface RequestLink {
  kind: RequestLinkKind;
  /** document id or application id; undefined for a general request */
  id?: string;
  /** display label: document title or "University — Program" */
  label?: string;
  /** SOP / LOR, only for document links */
  documentType?: string;
}

export interface StudentRequestViewModel {
  id: string;
  title: string;
  description: string;
  status: RequestStatus;
  isUrgent: boolean;
  urgentReason: string;
  adminResponse: string;
  createdAt: string;
  updatedAt: string;
  respondedAt: string;
  link: RequestLink;
}

export interface AdminRequestViewModel extends StudentRequestViewModel {
  studentName: string;
  greScore: number;
  toeflScore: number;
  /** linked document (if any) */
  documentId?: string;
  documentTitle?: string;
  documentType?: string;
  documentContent?: string;
  /** linked application (if any) */
  applicationId?: string;
  universityName?: string;
  programName?: string;
  applicationStatus?: string;
  applicationDeadline?: string;
}

interface ApiDocumentLink {
  id: string;
  title: string;
  type: string;
  content?: string;
}

interface ApiApplicationLink {
  id: string;
  university_name: string;
  program_name: string | null;
  status?: string;
  deadline?: string | null;
}

function toLink(
  doc?: ApiDocumentLink | null,
  app?: ApiApplicationLink | null
): RequestLink {
  if (doc) {
    return { kind: "document", id: doc.id, label: doc.title, documentType: doc.type };
  }
  if (app) {
    const label = app.program_name
      ? `${app.university_name} — ${app.program_name}`
      : app.university_name;
    return { kind: "application", id: app.id, label };
  }
  return { kind: "general" };
}

/** Row from GET /api/student/requests */
export interface ApiStudentRequestRow {
  id: string;
  title: string;
  description: string;
  status: RequestStatus;
  is_urgent: boolean;
  urgent_reason: string | null;
  admin_response: string | null;
  created_at: string;
  updated_at: string;
  responded_at: string | null;
  documents?: ApiDocumentLink | null;
  applications?: ApiApplicationLink | null;
}

export function mapApiStudentRequestToViewModel(r: ApiStudentRequestRow): StudentRequestViewModel {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    status: r.status,
    isUrgent: r.is_urgent,
    urgentReason: r.urgent_reason || "",
    adminResponse: r.admin_response || "",
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    respondedAt: r.responded_at || "",
    link: toLink(r.documents, r.applications),
  };
}

/** Row from GET /api/admin/requests (includes joined profile, document, application) */
export interface ApiAdminRequestRow extends ApiStudentRequestRow {
  profiles: {
    full_name: string;
    gre_score?: number;
    toefl_score?: number;
  };
  documents?: (ApiDocumentLink & { content?: string }) | null;
  applications?: ApiApplicationLink | null;
}

export function mapApiAdminRequestToViewModel(r: ApiAdminRequestRow): AdminRequestViewModel {
  const base = mapApiStudentRequestToViewModel(r);
  return {
    ...base,
    studentName: r.profiles?.full_name ?? "Unknown",
    greScore: r.profiles?.gre_score ?? 0,
    toeflScore: r.profiles?.toefl_score ?? 0,
    documentId: r.documents?.id,
    documentTitle: r.documents?.title,
    documentType: r.documents?.type,
    documentContent: r.documents?.content,
    applicationId: r.applications?.id,
    universityName: r.applications?.university_name,
    programName: r.applications?.program_name ?? undefined,
    applicationStatus: r.applications?.status,
    applicationDeadline: r.applications?.deadline ?? undefined,
  };
}
