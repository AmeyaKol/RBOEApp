export type DocumentType = "SOP" | "LOR" | "RESUME" | "TRANSCRIPT";

export interface DocumentViewModel {
  id: string;
  type: DocumentType;
  title: string;
  content: string;
  isMaster: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

/** Row shape from GET /api/student/documents */
export interface ApiStudentDocumentRow {
  id: string;
  type: string;
  title: string;
  content?: string | null;
  is_master?: boolean;
  version?: number;
  created_at: string;
  updated_at: string;
}

function normalizeType(t: string): DocumentType {
  const u = t.toUpperCase();
  if (u === "SOP" || u === "LOR" || u === "RESUME" || u === "TRANSCRIPT") {
    return u;
  }
  return "SOP";
}

export function mapApiDocumentToViewModel(doc: ApiStudentDocumentRow): DocumentViewModel {
  return {
    id: doc.id,
    type: normalizeType(doc.type),
    title: doc.title,
    content: doc.content || "Start writing your document here...",
    isMaster: Boolean(doc.is_master),
    version: doc.version ?? 1,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at,
  };
}
