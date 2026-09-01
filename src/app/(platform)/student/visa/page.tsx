"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader, PageShell } from "@/components/shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { Plane, Loader2, Video } from "lucide-react";

interface VisaInterview {
  id: string;
  university_name: string | null;
  intended_start_date: string | null;
  visa_slot_date: string | null;
  notes: string | null;
  status: "REQUESTED" | "SCHEDULED" | "COMPLETED" | "CANCELLED";
  scheduled_at: string | null;
  interviewer: string | null;
  meeting_link: string | null;
  feedback: string | null;
  requested_at: string;
}

interface AppOption {
  id: string;
  university_name: string;
  program_name: string | null;
}

const STATUS_META: Record<VisaInterview["status"], string> = {
  REQUESTED: "bg-amber-100 text-amber-800",
  SCHEDULED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-slate-100 text-slate-600",
};

const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString() : "—");

export default function StudentVisaPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<VisaInterview[]>([]);
  const [apps, setApps] = useState<AppOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    application_id: "",
    university_name: "",
    intended_start_date: "",
    visa_slot_date: "",
    notes: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [vRes, aRes] = await Promise.all([
        fetch("/api/student/visa"),
        fetch("/api/student/applications"),
      ]);
      if (vRes.ok) setRows((await vRes.json()) as VisaInterview[]);
      if (aRes.ok) setApps((await aRes.json()) as AppOption[]);
    } catch {
      setError("Could not load your visa interviews.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const chosen = apps.find((a) => a.id === form.application_id);
      const res = await fetch("/api/student/visa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          application_id: form.application_id || undefined,
          university_name: chosen?.university_name || form.university_name,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Request failed");
      setForm({ application_id: "", university_name: "", intended_start_date: "", visa_slot_date: "", notes: "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setSubmitting(false);
    }
  };

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
        title="Visa mock interview"
        description="Once your university is finalized and your visa slot is booked, request a mock interview with the RBOE team."
      />
      {error && (
        <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Plane className="h-4 w-4" /> Request a mock
            </CardTitle>
            <CardDescription>The actual interview happens on the link your counselor sends back.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="app">University</Label>
                {apps.length > 0 ? (
                  <select
                    id="app"
                    className="w-full rounded-md border p-2 text-sm"
                    value={form.application_id}
                    onChange={(e) => setForm((f) => ({ ...f, application_id: e.target.value }))}
                    required
                  >
                    <option value="">Select an application</option>
                    {apps.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.university_name}
                        {a.program_name ? ` — ${a.program_name}` : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id="app"
                    placeholder="University name"
                    value={form.university_name}
                    onChange={(e) => setForm((f) => ({ ...f, university_name: e.target.value }))}
                    required
                  />
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="start">Intended start date</Label>
                <Input
                  id="start"
                  type="date"
                  value={form.intended_start_date}
                  onChange={(e) => setForm((f) => ({ ...f, intended_start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slot">Visa interview slot</Label>
                <Input
                  id="slot"
                  type="date"
                  value={form.visa_slot_date}
                  onChange={(e) => setForm((f) => ({ ...f, visa_slot_date: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  rows={2}
                  placeholder="Consulate, first attempt, anything to prep for…"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Request mock interview
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          {rows.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No mock interviews yet.
              </CardContent>
            </Card>
          ) : (
            rows.map((r) => (
              <Card key={r.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{r.university_name}</CardTitle>
                      <CardDescription>
                        Visa slot {fmt(r.visa_slot_date)} · intended start {fmt(r.intended_start_date)}
                      </CardDescription>
                    </div>
                    <Badge className={STATUS_META[r.status]}>
                      {r.status.charAt(0) + r.status.slice(1).toLowerCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {r.notes && <p className="text-muted-foreground">{r.notes}</p>}
                  {r.status === "SCHEDULED" && r.scheduled_at && (
                    <div className="rounded-md bg-blue-50 p-3 text-blue-900">
                      <p className="font-medium">
                        Scheduled for {new Date(r.scheduled_at).toLocaleString()} with {r.interviewer}
                      </p>
                      {r.meeting_link && (
                        <p className="mt-1 flex items-center gap-1 break-all">
                          <Video className="h-3.5 w-3.5" /> {r.meeting_link}
                        </p>
                      )}
                    </div>
                  )}
                  {r.status === "COMPLETED" && (
                    <div className="rounded-md bg-green-50 p-3 text-green-900">
                      <p className="font-medium">Completed</p>
                      {r.feedback && <p className="mt-1">{r.feedback}</p>}
                    </div>
                  )}
                  {r.status === "REQUESTED" && (
                    <p className="text-muted-foreground">
                      Waiting for your counselor to confirm a time.
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </PageShell>
  );
}
