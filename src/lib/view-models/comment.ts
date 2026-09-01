export interface CommentViewModel {
  id: string;
  content: string;
  authorName: string;
  authorRole: "STUDENT" | "ADMIN" | "UNKNOWN";
  createdAt: string;
  documentId?: string;
  applicationId?: string;
}

/** Row from /api/comments (GET list or POST single) */
export interface ApiCommentRow {
  id: string;
  content: string;
  created_at: string;
  document_id: string | null;
  application_id: string | null;
  user_id: string;
  author_name: string | null;
  author_role: string | null;
}

export function mapApiCommentToViewModel(c: ApiCommentRow): CommentViewModel {
  return {
    id: c.id,
    content: c.content,
    authorName: c.author_name || "User",
    authorRole:
      c.author_role === "ADMIN" ? "ADMIN" : c.author_role === "STUDENT" ? "STUDENT" : "UNKNOWN",
    createdAt: c.created_at,
    documentId: c.document_id ?? undefined,
    applicationId: c.application_id ?? undefined,
  };
}
