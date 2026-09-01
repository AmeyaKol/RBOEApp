"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CommentThread } from "@/components/features/CommentThread";
import { History, Loader2, Save, ChevronDown, ChevronRight } from "lucide-react";

interface DocumentVersion {
  id: string;
  version: number;
  content: string | null;
  version_note: string | null;
  editor_name: string | null;
  editor_role: string | null;
  created_at: string;
}

interface DocumentEditorProps {
  documentId: string;
  title: string;
  type: string;
  initialContent: string;
  initialVersion: number;
  /** when set, offer to resolve this document-edit request on save */
  linkedRequestId?: string;
  onSaved?: (result: { version: number; resolvedRequest: unknown }) => void;
}

/**
 * Admin-side editor for a student's SOP / LOR. Saving snapshots the previous
 * text into the version history and bumps the live document. If the editor was
 * opened from a document-edit request, the admin can close that request in the
 * same save.
 */
export function DocumentEditor({
  documentId,
  title,
  type,
  initialContent,
  initialVersion,
  linkedRequestId,
  onSaved,
}: DocumentEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [baseline, setBaseline] = useState(initialContent);
  const [note, setNote] = useState("");
  const [version, setVersion] = useState(initialVersion);
  const [resolveRequest, setResolveRequest] = useState(Boolean(linkedRequestId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const dirty = content !== baseline;

  const loadVersions = useCallback(async () => {
    try {
      const res = await fetch(`/api/documents/${documentId}/versions`);
      if (res.ok) setVersions((await res.json()) as DocumentVersion[]);
    } catch {
      /* non-fatal */
    }
  }, [documentId]);

  useEffect(() => {
    setContent(initialContent);
    setBaseline(initialContent);
    setVersion(initialVersion);
    setNote("");
    setSavedMsg(null);
    setError(null);
    loadVersions();
  }, [documentId, initialContent, initialVersion, loadVersions]);

  const save = async () => {
    setSaving(true);
    setError(null);
    setSavedMsg(null);
    try {
      const res = await fetch(`/api/admin/documents/${documentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          version_note: note.trim() || undefined,
          resolve_request_id: resolveRequest && linkedRequestId ? linkedRequestId : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setVersion(data.version);
      setBaseline(content);
      setNote("");
      setSavedMsg(
        data.resolvedRequest
          ? `Saved as v${data.version} and the linked request was closed.`
          : `Saved as v${data.version}.`
      );
      await loadVersions();
      onSaved?.({ version: data.version, resolvedRequest: data.resolvedRequest });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">
            {type} · currently v{version}
            {dirty ? " · unsaved changes" : ""}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowHistory((s) => !s)}
        >
          <History className="mr-2 h-4 w-4" />
          History ({versions.length})
        </Button>
      </div>

      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[280px] font-sans text-sm leading-relaxed"
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What changed in this version? (optional)"
          className="sm:flex-1"
        />
        <Button onClick={save} disabled={saving || !dirty}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save version
        </Button>
      </div>

      {linkedRequestId && (
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={resolveRequest}
            onChange={(e) => setResolveRequest(e.target.checked)}
          />
          Close the linked request when I save
        </label>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      {savedMsg && <p className="text-sm text-emerald-700">{savedMsg}</p>}

      {showHistory && (
        <div className="rounded-lg border">
          <div className="border-b px-3 py-2 text-sm font-medium">Version history</div>
          {versions.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">
              No earlier versions yet. The first save records one.
            </p>
          ) : (
            <ul className="divide-y">
              {versions.map((v) => (
                <li key={v.id} className="px-3 py-2 text-sm">
                  <button
                    className="flex w-full items-center gap-2 text-left"
                    onClick={() => setExpanded((e) => (e === v.id ? null : v.id))}
                  >
                    {expanded === v.id ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                    <span className="font-medium">v{v.version}</span>
                    {v.editor_role && (
                      <Badge
                        variant="secondary"
                        className={
                          v.editor_role === "ADMIN"
                            ? "bg-indigo-100 text-indigo-800"
                            : "bg-slate-100 text-slate-700"
                        }
                      >
                        {v.editor_name || v.editor_role}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(v.created_at).toLocaleString()}
                    </span>
                    {v.version_note && (
                      <span className="truncate text-xs text-muted-foreground">
                        — {v.version_note}
                      </span>
                    )}
                  </button>
                  {expanded === v.id && (
                    <pre className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap rounded bg-muted p-2 text-xs">
                      {v.content || "(empty)"}
                    </pre>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="border-t pt-4">
        <CommentThread documentId={documentId} />
      </div>
    </div>
  );
}
