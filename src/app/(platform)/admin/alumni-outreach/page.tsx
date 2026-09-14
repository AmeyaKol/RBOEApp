"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader, PageShell } from "@/components/shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { Users, Network, Loader2, Plus, MessageSquarePlus, GraduationCap } from "lucide-react";

interface Alumnus {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  grad_year: number | null;
  university: string | null;
  program: string | null;
  job_title: string | null;
  company: string | null;
  location: string | null;
  status: "ACTIVE" | "INACTIVE" | "PENDING";
  tips: { housing?: string; travel?: string; campus_employment?: string; general?: string } | null;
  notes: string | null;
  outreach_total: number;
  outreach_connected: number;
}

interface OutreachEntry {
  id: string;
  alumni_id: string;
  alumni_name: string;
  alumni_university: string | null;
  student_name: string | null;
  channel: string | null;
  purpose: string | null;
  message: string | null;
  outcome: string | null;
  status: "LOGGED" | "CONTACTED" | "CONNECTED" | "CLOSED";
  logged_at: string;
}

interface StudentOption {
  user_id: string;
  full_name: string;
}

const OUTREACH_STATUS: Array<OutreachEntry["status"]> = ["LOGGED", "CONTACTED", "CONNECTED", "CLOSED"];
const OUTREACH_BADGE: Record<OutreachEntry["status"], string> = {
  LOGGED: "bg-slate-100 text-slate-700",
  CONTACTED: "bg-amber-100 text-amber-800",
  CONNECTED: "bg-blue-100 text-blue-800",
  CLOSED: "bg-green-100 text-green-800",
};
const ALUMNI_BADGE: Record<Alumnus["status"], string> = {
  ACTIVE: "bg-green-100 text-green-800",
  INACTIVE: "bg-slate-100 text-slate-600",
  PENDING: "bg-amber-100 text-amber-800",
};

const EMPTY_ALUM = {
  full_name: "",
  university: "",
  program: "",
  grad_year: "",
  job_title: "",
  company: "",
  location: "",
  email: "",
  linkedin_url: "",
  status: "ACTIVE",
  housing: "",
  travel: "",
  campus_employment: "",
  general: "",
};

export default function AlumniOutreachPage() {
  const { user } = useAuth();
  const [alumni, setAlumni] = useState<Alumnus[]>([]);
  const [outreach, setOutreach] = useState<OutreachEntry[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddAlum, setShowAddAlum] = useState(false);
  const [newAlum, setNewAlum] = useState({ ...EMPTY_ALUM });
  const [logForm, setLogForm] = useState({ student_id: "", channel: "email", purpose: "", message: "" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, oRes, sRes] = await Promise.all([
        fetch("/api/admin/alumni"),
        fetch("/api/admin/outreach"),
        fetch("/api/admin/students"),
      ]);
      if (aRes.ok) {
        const list = (await aRes.json()) as Alumnus[];
        setAlumni(list);
        setSelectedId((cur) => cur ?? list[0]?.id ?? null);
      }
      if (oRes.ok) setOutreach((await oRes.json()) as OutreachEntry[]);
      if (sRes.ok) setStudents((await sRes.json()) as StudentOption[]);
    } catch {
      setError("Could not load the alumni network.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const selected = useMemo(() => alumni.find((a) => a.id === selectedId) ?? null, [alumni, selectedId]);
  const selectedOutreach = useMemo(
    () => outreach.filter((o) => o.alumni_id === selectedId),
    [outreach, selectedId]
  );
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return alumni.filter(
      (a) =>
        a.full_name.toLowerCase().includes(q) ||
        (a.university || "").toLowerCase().includes(q) ||
        (a.company || "").toLowerCase().includes(q)
    );
  }, [alumni, search]);

  const stats = useMemo(
    () => ({
      total: alumni.length,
      active: alumni.filter((a) => a.status === "ACTIVE").length,
      connections: outreach.filter((o) => o.status === "CONNECTED" || o.status === "CLOSED").length,
      openOutreach: outreach.filter((o) => o.status === "LOGGED" || o.status === "CONTACTED").length,
    }),
    [alumni, outreach]
  );

  const addAlumnus = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/alumni", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: newAlum.full_name,
          university: newAlum.university,
          program: newAlum.program,
          grad_year: newAlum.grad_year ? Number(newAlum.grad_year) : null,
          job_title: newAlum.job_title,
          company: newAlum.company,
          location: newAlum.location,
          email: newAlum.email,
          linkedin_url: newAlum.linkedin_url,
          status: newAlum.status,
          tips: {
            housing: newAlum.housing || null,
            travel: newAlum.travel || null,
            campus_employment: newAlum.campus_employment || null,
            general: newAlum.general || null,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add alumnus");
      setNewAlum({ ...EMPTY_ALUM });
      setShowAddAlum(false);
      await load();
      setSelectedId(data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add alumnus");
    } finally {
      setBusy(false);
    }
  };

  const logOutreach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alumni_id: selectedId,
          student_id: logForm.student_id || undefined,
          channel: logForm.channel,
          purpose: logForm.purpose,
          message: logForm.message,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to log outreach");
      setLogForm({ student_id: "", channel: "email", purpose: "", message: "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log outreach");
    } finally {
      setBusy(false);
    }
  };

  const advance = async (entry: OutreachEntry, status: OutreachEntry["status"]) => {
    await fetch("/api/admin/outreach", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: entry.id, status }),
    });
    load();
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
        title="Alumni outreach"
        description="A directory of RBOE alumni and a log of who reached out, why, and how it went. Records only — nothing is sent from here."
        actions={
          <Button onClick={() => setShowAddAlum((s) => !s)}>
            <Plus className="mr-2 h-4 w-4" /> Add alumnus
          </Button>
        }
      />
      {error && (
        <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {showAddAlum && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">New alumnus</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addAlumnus} className="grid gap-3 md:grid-cols-3">
              {(
                [
                  ["full_name", "Full name", true],
                  ["university", "University", false],
                  ["program", "Program", false],
                  ["grad_year", "Grad year", false],
                  ["job_title", "Job title", false],
                  ["company", "Company", false],
                  ["location", "Location", false],
                  ["email", "Email", false],
                  ["linkedin_url", "LinkedIn URL", false],
                ] as const
              ).map(([key, label, required]) => (
                <div key={key} className="space-y-1.5">
                  <Label htmlFor={`na-${key}`}>{label}</Label>
                  <Input
                    id={`na-${key}`}
                    required={required}
                    value={(newAlum as Record<string, string>)[key]}
                    onChange={(e) => setNewAlum((p) => ({ ...p, [key]: e.target.value }))}
                  />
                </div>
              ))}
              {(
                [
                  ["housing", "Housing tips"],
                  ["travel", "Travel tips"],
                  ["campus_employment", "On-campus employment tips"],
                  ["general", "General tips"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="space-y-1.5 md:col-span-3">
                  <Label htmlFor={`na-${key}`}>{label}</Label>
                  <Textarea
                    id={`na-${key}`}
                    rows={2}
                    value={(newAlum as Record<string, string>)[key]}
                    onChange={(e) => setNewAlum((p) => ({ ...p, [key]: e.target.value }))}
                  />
                </div>
              ))}
              <div className="md:col-span-3 flex gap-2">
                <Button type="submit" disabled={busy}>
                  {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Add
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddAlum(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Alumni", value: stats.total, icon: Users },
          { label: "Active", value: stats.active, icon: GraduationCap },
          { label: "Connections made", value: stats.connections, icon: Network },
          { label: "Open outreach", value: stats.openOutreach, icon: MessageSquarePlus },
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

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Alumni directory</CardTitle>
              <Input
                placeholder="Search by name, university, or company…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mt-2"
              />
            </CardHeader>
            <CardContent className="space-y-2">
              {filtered.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setSelectedId(a.id)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    selectedId === a.id ? "border-primary bg-accent/30" : "hover:border-border"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="font-medium">{a.full_name}</span>
                    <Badge className={ALUMNI_BADGE[a.status]}>{a.status.toLowerCase()}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {a.job_title} at {a.company} · {a.program}, {a.university}
                    {a.grad_year ? ` '${String(a.grad_year).slice(2)}` : ""} · {a.outreach_total} outreach
                  </p>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {selected ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{selected.full_name}</CardTitle>
                  <CardDescription>
                    {selected.job_title} at {selected.company} · {selected.location}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>
                    {selected.program}, {selected.university}
                    {selected.grad_year ? ` (${selected.grad_year})` : ""}
                  </p>
                  {selected.email && <p className="text-muted-foreground">{selected.email}</p>}
                  {selected.tips &&
                    (["housing", "travel", "campus_employment", "general"] as const).map((k) =>
                      selected.tips?.[k] ? (
                        <div key={k} className="rounded bg-muted p-2">
                          <p className="text-xs font-medium capitalize">{k.replace("_", " ")}</p>
                          <p className="text-xs text-muted-foreground">{selected.tips[k]}</p>
                        </div>
                      ) : null
                    )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Log an outreach</CardTitle>
                  <CardDescription>Recorded only — no message is sent.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={logOutreach} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="lo-student">Student (optional)</Label>
                      <select
                        id="lo-student"
                        className="w-full rounded-md border p-2 text-sm"
                        value={logForm.student_id}
                        onChange={(e) => setLogForm((f) => ({ ...f, student_id: e.target.value }))}
                      >
                        <option value="">No specific student</option>
                        {students.map((s) => (
                          <option key={s.user_id} value={s.user_id}>
                            {s.full_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lo-channel">Channel</Label>
                      <select
                        id="lo-channel"
                        className="w-full rounded-md border p-2 text-sm"
                        value={logForm.channel}
                        onChange={(e) => setLogForm((f) => ({ ...f, channel: e.target.value }))}
                      >
                        {["email", "linkedin", "phone", "referral"].map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lo-purpose">Purpose</Label>
                      <Input
                        id="lo-purpose"
                        value={logForm.purpose}
                        onChange={(e) => setLogForm((f) => ({ ...f, purpose: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lo-message">Notes</Label>
                      <Textarea
                        id="lo-message"
                        rows={2}
                        value={logForm.message}
                        onChange={(e) => setLogForm((f) => ({ ...f, message: e.target.value }))}
                      />
                    </div>
                    <Button type="submit" disabled={busy} className="w-full">
                      {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Log outreach
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Outreach history</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selectedOutreach.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No outreach logged yet.</p>
                  ) : (
                    selectedOutreach.map((o) => (
                      <div key={o.id} className="rounded-lg border p-2 text-sm">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="font-medium">{o.purpose || "(no purpose)"}</span>
                          <Badge className={OUTREACH_BADGE[o.status]}>{o.status.toLowerCase()}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {o.channel}
                          {o.student_name ? ` · for ${o.student_name}` : ""} ·{" "}
                          {new Date(o.logged_at).toLocaleDateString()}
                        </p>
                        {o.message && <p className="mt-1 text-xs">{o.message}</p>}
                        {o.status !== "CLOSED" && (
                          <div className="mt-2 flex gap-1">
                            {OUTREACH_STATUS.filter(
                              (s) => OUTREACH_STATUS.indexOf(s) > OUTREACH_STATUS.indexOf(o.status)
                            ).map((s) => (
                              <button
                                key={s}
                                onClick={() => advance(o, s)}
                                className="rounded border px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted"
                              >
                                → {s.toLowerCase()}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex h-64 items-center justify-center text-center text-sm text-muted-foreground">
                Select an alumnus
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageShell>
  );
}
