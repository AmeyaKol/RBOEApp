"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader, PageShell } from "@/components/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import {
  Users,
  Clock,
  CheckCircle,
  Mail,
  Plus,
  Loader2,
  KeyRound,
  FileText,
  ArrowRight,
  UserCheck,
} from "lucide-react";

type Stage = "INVITED" | "ACCOUNT_CREATED" | "FORM_SENT" | "SUBMITTED" | "COMPLETED";

interface OnboardingTask {
  id: string;
  prospect_name: string;
  prospect_email: string;
  phone: string | null;
  source: string;
  status: Stage;
  student_id: string | null;
  assigned_admin_id: string | null;
  assigned_admin_name: string | null;
  invite_note: string | null;
  login_link: string | null;
  intake_token: string | null;
  next_follow_up: string | null;
  emails_log: Array<{ subject: string; template: string; sent_at: string; note?: string }>;
  created_at: string;
  profile: null | {
    onboarding_stage: string;
    gre_score: number | null;
    toefl_score: number | null;
    undergrad_gpa: number | null;
    work_experience_months: number | null;
    undergrad_college: string | null;
    publications: number | null;
    target_degree: string | null;
    target_intake: string | null;
    intake_submitted_at: string | null;
    intake_data: Record<string, unknown> | null;
  };
}

const STAGE_META: Record<Stage, { label: string; className: string }> = {
  INVITED: { label: "Invited", className: "bg-gray-100 text-gray-800" },
  ACCOUNT_CREATED: { label: "Account created", className: "bg-blue-100 text-blue-800" },
  FORM_SENT: { label: "Form sent", className: "bg-amber-100 text-amber-800" },
  SUBMITTED: { label: "Submitted", className: "bg-violet-100 text-violet-800" },
  COMPLETED: { label: "Completed", className: "bg-green-100 text-green-800" },
};

export default function StudentOnboardingPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<OnboardingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<
    Record<string, { tempPassword: string; loginLink: string; email: string }>
  >({});

  const [showAdd, setShowAdd] = useState(false);
  const [newProspect, setNewProspect] = useState({ prospect_name: "", prospect_email: "", phone: "" });

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/onboarding");
      if (!res.ok) throw new Error("Failed to load onboarding tasks");
      const data = (await res.json()) as OnboardingTask[];
      setTasks(data);
      setSelectedId((cur) => cur ?? data[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchTasks();
  }, [user, fetchTasks]);

  const selected = useMemo(
    () => tasks.find((t) => t.id === selectedId) ?? null,
    [tasks, selectedId]
  );

  const stats = useMemo(() => {
    const by = (s: Stage[]) => tasks.filter((t) => s.includes(t.status)).length;
    return {
      total: tasks.length,
      awaiting: by(["INVITED", "ACCOUNT_CREATED", "FORM_SENT"]),
      submitted: by(["SUBMITTED"]),
      completed: by(["COMPLETED"]),
    };
  }, [tasks]);

  const runAction = async (id: string, action: string) => {
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/onboarding/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      if (action === "create_account" && data.tempPassword) {
        setCredentials((c) => ({
          ...c,
          [id]: { tempPassword: data.tempPassword, loginLink: data.loginLink, email: data.email },
        }));
      }
      await fetchTasks();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const addProspect = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch("/api/admin/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProspect),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add prospect");
      setNewProspect({ prospect_name: "", prospect_email: "", phone: "" });
      setShowAdd(false);
      await fetchTasks();
      setSelectedId(data.id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to add prospect");
    } finally {
      setBusy(false);
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
        title="Student onboarding"
        description="Provision student accounts, send the intake form, and review submitted details"
        actions={
          <Button onClick={() => setShowAdd((s) => !s)}>
            <Plus className="mr-2 h-4 w-4" />
            Add prospect
          </Button>
        }
      />

      {error && (
        <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {showAdd && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">New prospect</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addProspect} className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="np-name">Full name</Label>
                <Input
                  id="np-name"
                  value={newProspect.prospect_name}
                  onChange={(e) => setNewProspect((p) => ({ ...p, prospect_name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="np-email">Email</Label>
                <Input
                  id="np-email"
                  type="email"
                  value={newProspect.prospect_email}
                  onChange={(e) => setNewProspect((p) => ({ ...p, prospect_email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="np-phone">Phone (optional)</Label>
                <Input
                  id="np-phone"
                  value={newProspect.phone}
                  onChange={(e) => setNewProspect((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-3 flex gap-2">
                <Button type="submit" disabled={busy}>
                  {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Add to queue
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { icon: Users, label: "Total", value: stats.total },
          { icon: Clock, label: "Awaiting action", value: stats.awaiting },
          { icon: FileText, label: "Submitted", value: stats.submitted },
          { icon: CheckCircle, label: "Completed", value: stats.completed },
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

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Task list */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Onboarding queue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {tasks.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No prospects yet. Add one, or wait for a booking to come in.
                </p>
              )}
              {tasks.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    selectedId === t.id ? "border-primary bg-accent/30" : "hover:border-border"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="font-medium">{t.prospect_name}</span>
                    <Badge className={STAGE_META[t.status].className}>
                      {STAGE_META[t.status].label}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{t.prospect_email}</span>
                    {t.source === "booking" && <Badge variant="outline">from booking</Badge>}
                    {t.assigned_admin_name && <span>· {t.assigned_admin_name}</span>}
                    {t.next_follow_up && <span>· follow up {new Date(t.next_follow_up).toLocaleDateString()}</span>}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Detail panel */}
        <div className="space-y-6">
          {selected ? (
            <OnboardingDetail
              task={selected}
              busy={busy}
              actionError={actionError}
              credentials={credentials[selected.id]}
              onAction={(a) => runAction(selected.id, a)}
            />
          ) : (
            <Card>
              <CardContent className="flex h-64 items-center justify-center text-center">
                <p className="text-sm text-muted-foreground">Select a prospect to manage onboarding</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageShell>
  );
}

function OnboardingDetail({
  task,
  busy,
  actionError,
  credentials,
  onAction,
}: {
  task: OnboardingTask;
  busy: boolean;
  actionError: string | null;
  credentials?: { tempPassword: string; loginLink: string; email: string };
  onAction: (action: string) => void;
}) {
  const intake = task.profile;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCheck className="h-4 w-4" />
            {task.prospect_name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Email" value={task.prospect_email} />
          <Row label="Phone" value={task.phone || "—"} />
          <Row label="Source" value={task.source === "booking" ? "Landing-page booking" : "Added manually"} />
          <Row label="Counselor" value={task.assigned_admin_name || "Unassigned"} />
          {task.invite_note && <Row label="Note" value={task.invite_note} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Next step</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {actionError && (
            <div className="rounded-md bg-red-50 p-2 text-sm text-red-700">{actionError}</div>
          )}

          {task.status === "INVITED" && (
            <>
              <p className="text-sm text-muted-foreground">
                Provision the student&apos;s account. Their email is pre-confirmed so they can sign in
                immediately with the temporary password.
              </p>
              <Button className="w-full" disabled={busy} onClick={() => onAction("create_account")}>
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                Create student account
              </Button>
            </>
          )}

          {task.status === "ACCOUNT_CREATED" && (
            <>
              <p className="text-sm text-muted-foreground">
                Account is ready. Send the intake form so the student can fill in GPA, GRE, TOEFL,
                work experience, and target programs.
              </p>
              <Button className="w-full" disabled={busy} onClick={() => onAction("send_form")}>
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                Send intake form
              </Button>
            </>
          )}

          {task.status === "FORM_SENT" && (
            <>
              <p className="text-sm text-muted-foreground">
                Waiting for the student to submit their intake form.
              </p>
              <Button variant="outline" className="w-full" disabled={busy} onClick={() => onAction("nudge")}>
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                Log a reminder
              </Button>
            </>
          )}

          {task.status === "SUBMITTED" && (
            <>
              <p className="text-sm text-muted-foreground">
                Intake received. Review the details below, then complete onboarding to move the student
                into active guidance.
              </p>
              <Button className="w-full" disabled={busy} onClick={() => onAction("complete")}>
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                Complete onboarding
              </Button>
            </>
          )}

          {task.status === "COMPLETED" && task.student_id && (
            <div className="flex items-center justify-between rounded-md bg-green-50 p-3 text-sm text-green-800">
              <span>Onboarding complete.</span>
              <Link href={`/admin/students/${task.student_id}`} className="inline-flex items-center gap-1 font-medium">
                Open profile <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          {credentials && (
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm">
              <p className="mb-1 font-medium text-blue-900">Hand these to {credentials.email}</p>
              <p className="text-blue-800">
                Temp password: <code className="rounded bg-white px-1">{credentials.tempPassword}</code>
              </p>
              <p className="mt-1 break-all text-blue-800">
                Login link: <span className="underline">{credentials.loginLink}</span>
              </p>
              <p className="mt-1 text-xs text-blue-700">
                Shown once here — nothing is emailed in this demo.
              </p>
            </div>
          )}

          {task.login_link && !credentials && task.status !== "INVITED" && (
            <p className="break-all text-xs text-muted-foreground">
              Login link: <span className="underline">{task.login_link}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {intake?.intake_submitted_at && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Submitted intake</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="GRE" value={intake.gre_score ?? "—"} />
            <Row label="TOEFL" value={intake.toefl_score ?? "—"} />
            <Row label="Undergrad GPA" value={intake.undergrad_gpa ?? "—"} />
            <Row
              label="Work experience"
              value={intake.work_experience_months != null ? `${intake.work_experience_months} months` : "—"}
            />
            <Row label="Undergrad college" value={intake.undergrad_college || "—"} />
            <Row label="Publications" value={intake.publications ?? 0} />
            <Row label="Target degree" value={intake.target_degree || "—"} />
            <Row label="Target intake" value={intake.target_intake || "—"} />
            {typeof intake.intake_data?.notes === "string" && intake.intake_data.notes && (
              <Row label="Notes" value={intake.intake_data.notes as string} />
            )}
            <p className="pt-1 text-xs text-muted-foreground">
              Submitted {new Date(intake.intake_submitted_at).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      )}

      {task.emails_log.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact log</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {task.emails_log.map((e, i) => (
                <li key={i} className="flex items-start justify-between gap-2">
                  <span>{e.subject}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(e.sent_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">Records only — no email is sent in this demo.</p>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
