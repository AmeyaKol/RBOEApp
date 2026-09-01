"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare } from "lucide-react";
import {
  mapApiCommentToViewModel,
  type ApiCommentRow,
  type CommentViewModel,
} from "@/lib/view-models/comment";

interface CommentThreadProps {
  /** Provide exactly one anchor. */
  documentId?: string;
  applicationId?: string;
  /** Hide the add-comment box (view only). Default: false — both roles may comment. */
  readOnly?: boolean;
  className?: string;
}

/**
 * Comment-only thread anchored to a document or an application.
 * Comments are immutable — there is no edit or delete.
 */
export function CommentThread({
  documentId,
  applicationId,
  readOnly = false,
  className = "",
}: CommentThreadProps) {
  const [comments, setComments] = useState<CommentViewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const anchorQuery = documentId
    ? `documentId=${documentId}`
    : applicationId
    ? `applicationId=${applicationId}`
    : null;

  const fetchComments = useCallback(async () => {
    if (!anchorQuery) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/comments?${anchorQuery}`);
      if (!res.ok) throw new Error("Failed to load comments");
      const data = (await res.json()) as ApiCommentRow[];
      setComments(data.map(mapApiCommentToViewModel));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load comments");
    } finally {
      setLoading(false);
    }
  }, [anchorQuery]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handlePost = async () => {
    const content = text.trim();
    if (!content || posting) return;
    setPosting(true);
    setError(null);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          documentId ? { content, document_id: documentId } : { content, application_id: applicationId }
        ),
      });
      if (!res.ok) throw new Error("Failed to post comment");
      const created = mapApiCommentToViewModel((await res.json()) as ApiCommentRow);
      setComments((prev) => [...prev, created]);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-medium">
        <MessageSquare className="h-4 w-4" />
        Comments
        {comments.length > 0 && (
          <span className="text-muted-foreground">({comments.length})</span>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading comments…
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="rounded-lg border p-3">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-sm font-medium">{c.authorName}</span>
                {c.authorRole !== "UNKNOWN" && (
                  <Badge
                    variant="secondary"
                    className={
                      c.authorRole === "ADMIN"
                        ? "bg-indigo-100 text-indigo-800"
                        : "bg-slate-100 text-slate-700"
                    }
                  >
                    {c.authorRole === "ADMIN" ? "Admin" : "Student"}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {new Date(c.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{c.content}</p>
            </li>
          ))}
        </ul>
      )}

      {!readOnly && (
        <div className="space-y-2">
          <Textarea
            placeholder="Add a comment…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[72px]"
            disabled={posting}
          />
          <Button size="sm" onClick={handlePost} disabled={!text.trim() || posting}>
            {posting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Posting…
              </>
            ) : (
              "Add Comment"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
