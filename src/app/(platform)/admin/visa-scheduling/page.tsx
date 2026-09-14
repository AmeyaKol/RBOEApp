"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader, PageShell } from "@/components/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { Plane, Loader2, CalendarClock, CheckCircle2 } from "lucide-react";

type Status = "REQUESTED" | "SCHEDULED" | "COMPLETED" | "CANCELLED";

interface VisaInterview {
  id: string;
  student_id: string;
  student_name: string;
  student_phone: string | null;
  university_name: string | null;
  intended_start_date: string | null;
  visa_slot_date: string | null;
  notes: string | null;
  status: Status;
  scheduled_at: string | null;
  interviewer: string | null;
  meeting_link: string | null;
  student_notified: boolean;
  feedback: string | null;
  requested_at: string;
}

const STATUS_META: Record<Status, string> = {
  REQUESTED: "bg-amber-100 text-amber-800",
  SCHEDULED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-slate-100 text-slate-600",
};

const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString() : "—");

export default function VisaSchedulingPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<VisaInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<Status | "ALL">("ALL");
  const [editing, setEditing] = useState<VisaInterview | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/visa");
      if (!res.ok) throw new Error("Failed to load visa interviews");
      setRows((await res.json()) as VisaInterview[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const visible = useMemo(
    () => (statusFilter === "ALL" ? rows : rows.filter((r) => r.status === statusFilter)),
    [rows, statusFilter]
  );

  const stats = useMemo(
    () => ({
      requested: rows.filter((r) => r.status === "REQUESTED").length,
      scheduled: rows.filter((r) => r.status === "SCHEDULED").length,
      completed: rows.filter((r) => r.status === "COMPLETED").length,
    }),
    [rows]
  );

  if (loading) {
    return (
      <PageShell>
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Visa mock interview scheduling"
        description="Every student's visa slot, sorted by date. Schedule a mock with the counseling team — the interview runs on the meeting link you set."
      />
      {error && (
        <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="mb-6 grid grid-cols-3 gap-4">
        {[
          { label: "Requested", value: stats.requested, icon: Plane },
          { label: "Scheduled", value: stats.scheduled, icon: CalendarClock },
          { label: "Completed", value: stats.completed, icon: CheckCircle2 },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-6">
              <div className="rounded-lg border border-border bg-card p-2">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Status:</span>
        {(["ALL", "REQUESTED", "SCHEDULED", "COMPLETED", "CANCELLED"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              statusFilter === s
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Interviews</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {visible.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nothing here.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-4">Student</th>
                  <th className="py-2 pr-4">University</th>
                  <th className="py-2 pr-4">Visa slot</th>
                  <th className="py-2 pr-4">Intended start</th>
                  <th className="py-2 pr-4">Mock</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{r.student_name}</td>
                    <td className="py-2 pr-4">{r.university_name || "—"}</td>
                    <td className="py-2 pr-4">{fmtDate(r.visa_slot_date)}</td>
                    <td className="py-2 pr-4">{fmtDate(r.intended_start_date)}</td>
                    <td className="py-2 pr-4">
                      {r.scheduled_at
                        ? `${new Date(r.scheduled_at).toLocaleString()} · ${r.interviewer}`
                        : "—"}
                    </td>
                    <td className="py-2 pr-4">
                      <Badge className={STATUS_META[r.status]}>
                        {r.status.charAt(0) + r.status.slice(1).toLowerCase()}
                      </Badge>
                    </td>
                    <td className="py-2 text-right">
                      <Button size="sm" variant="outline" onClick={() => setEditing(r)}>
                        {r.status === "REQUESTED" ? "Schedule" : "Manage"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {editing && (
        <ManageDialog
          row={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </PageShell>
  );
}

function ManageDialog({
  row,
  onClose,
  onSaved,
}: {
  row: VisaInterview;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [scheduledAt, setScheduledAt] = useState(
    row.scheduled_at ? row.scheduled_at.slice(0, 16) : ""
  );
  const [interviewer, setInterviewer] = useState(row.interviewer || "Rajiv");
  const [meetingLink, setMeetingLink] = useState(row.meeting_link || "");
  const [feedback, setFeedback] = useState(row.feedback || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const put = async (patch: Record<string, unknown>) => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/visa/${row.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Update failed");
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">
            {row.student_name} — {row.university_name || "visa mock"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Visa slot {fmtDate(row.visa_slot_date)} · intended start {fmtDate(row.intended_start_date)}
            {row.notes ? ` · ${row.notes}` : ""}
          </p>
          {err && <div className="rounded-md bg-red-50 p-2 text-sm text-red-700">{err}</div>}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="sched">Mock date & time</Label>
              <Input
                id="sched"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="int">Interviewer</Label>
              <Input id="int" value={interviewer} onChange={(e) => setInterviewer(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="link">Meeting link (Zoom / Meet)</Label>
            <Input
              id="link"
              placeholder="https://meet.google.com/..."
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              disabled={busy || !scheduledAt}
              onClick={() =>
                put({
                  status: "SCHEDULED",
                  scheduled_at: new Date(scheduledAt).toISOString(),
                  interviewer,
                  meeting_link: meetingLink,
                })
              }
            >
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {row.status === "REQUESTED" ? "Schedule & notify" : "Save schedule"}
            </Button>
            {row.status !== "REQUESTED" && row.status !== "CANCELLED" && (
              <Button variant="outline" disabled={busy} onClick={() => put({ status: "CANCELLED" })}>
                Cancel interview
              </Button>
            )}
          </div>

          {(row.status === "SCHEDULED" || row.status === "COMPLETED") && (
            <div className="space-y-1.5 border-t pt-4">
              <Label htmlFor="fb">Feedback (after the mock)</Label>
              <Textarea
                id="fb"
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => put({ status: "COMPLETED", feedback })}
              >
                Mark completed
              </Button>
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="ghost" onClick={onClose} disabled={busy}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
