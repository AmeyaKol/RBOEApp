"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, PageShell } from "@/components/shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle, Loader2, ClipboardList, ArrowRight } from "lucide-react";

interface OnboardingState {
  profile: {
    full_name: string;
    onboarding_stage: string;
    intake_submitted_at: string | null;
    gre_score: number | null;
    toefl_score: number | null;
    undergrad_gpa: number | null;
    work_experience_months: number | null;
    undergrad_college: string | null;
    publications: number | null;
    target_degree: string | null;
    target_intake: string | null;
    intake_data: Record<string, unknown> | null;
  };
  task: { status: string; next_follow_up: string | null } | null;
}

const EMPTY = {
  gre_score: "",
  toefl_score: "",
  undergrad_gpa: "",
  work_experience_months: "",
  undergrad_college: "",
  publications: "",
  target_degree: "",
  target_intake: "",
  notes: "",
};

export default function StudentOnboardingPage() {
  const { user } = useAuth();
  const [state, setState] = useState<OnboardingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/student/onboarding");
      if (!res.ok) throw new Error("Failed to load");
      const data = (await res.json()) as OnboardingState;
      setState(data);
      setForm((f) => ({
        ...f,
        gre_score: data.profile.gre_score?.toString() ?? "",
        toefl_score: data.profile.toefl_score?.toString() ?? "",
        undergrad_gpa: data.profile.undergrad_gpa?.toString() ?? "",
        work_experience_months: data.profile.work_experience_months?.toString() ?? "",
        undergrad_college: data.profile.undergrad_college ?? "",
        publications: data.profile.publications?.toString() ?? "",
        target_degree: data.profile.target_degree ?? "",
        target_intake: data.profile.target_intake ?? "",
      }));
    } catch {
      setError("Could not load your onboarding status.");
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
      const res = await fetch("/api/student/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !state) {
    return (
      <PageShell>
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageShell>
    );
  }

  const stage = state.profile.onboarding_stage;
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  if (stage === "ACTIVE") {
    return (
      <PageShell>
        <PageHeader title="Onboarding" description="You're all set" />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
            <p className="text-sm text-muted-foreground">
              Your onboarding is complete and your counselor has your profile.
            </p>
            <Link href="/student/dashboard">
              <Button>
                Go to dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  if (stage === "SUBMITTED") {
    const p = state.profile;
    return (
      <PageShell>
        <PageHeader title="Onboarding" description="Your details are in — your counselor is reviewing them" />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Submitted{p.intake_submitted_at ? ` on ${new Date(p.intake_submitted_at).toLocaleDateString()}` : ""}
            </CardTitle>
            <CardDescription>
              You&apos;ll get a recommended college list within a day or two. You can start exploring the
              rest of the portal now.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
            <Item label="GRE" value={p.gre_score} />
            <Item label="TOEFL" value={p.toefl_score} />
            <Item label="Undergrad GPA" value={p.undergrad_gpa} />
            <Item
              label="Work experience"
              value={p.work_experience_months != null ? `${p.work_experience_months} months` : null}
            />
            <Item label="Undergrad college" value={p.undergrad_college} />
            <Item label="Publications" value={p.publications ?? 0} />
            <Item label="Target degree" value={p.target_degree} />
            <Item label="Target intake" value={p.target_intake} />
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  // INVITED / ACCOUNT_CREATED / FORM_SENT → show the form
  return (
    <PageShell>
      <PageHeader
        title="Complete your profile"
        description="Your counselor needs these details to build your university shortlist"
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-4 w-4" />
            Intake form
          </CardTitle>
          <CardDescription>Leave a field blank if you don&apos;t have it yet — you can update it later.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="gre" label="GRE score (260–340)">
                <Input id="gre" type="number" min={260} max={340} value={form.gre_score} onChange={set("gre_score")} />
              </Field>
              <Field id="toefl" label="TOEFL score (0–120)">
                <Input id="toefl" type="number" min={0} max={120} value={form.toefl_score} onChange={set("toefl_score")} />
              </Field>
              <Field id="gpa" label="Undergrad GPA (0.0–4.0)">
                <Input id="gpa" type="number" step="0.01" min={0} max={4} value={form.undergrad_gpa} onChange={set("undergrad_gpa")} />
              </Field>
              <Field id="yoe" label="Work experience (months)">
                <Input id="yoe" type="number" min={0} value={form.work_experience_months} onChange={set("work_experience_months")} />
              </Field>
              <Field id="college" label="Undergraduate college">
                <Input id="college" value={form.undergrad_college} onChange={set("undergrad_college")} />
              </Field>
              <Field id="pubs" label="Publications">
                <Input id="pubs" type="number" min={0} value={form.publications} onChange={set("publications")} />
              </Field>
              <Field id="degree" label="Target degree">
                <Input id="degree" placeholder="MS Computer Science" value={form.target_degree} onChange={set("target_degree")} />
              </Field>
              <Field id="intake" label="Target intake">
                <Input id="intake" placeholder="Fall 2026" value={form.target_intake} onChange={set("target_intake")} />
              </Field>
            </div>
            <Field id="notes" label="Anything else your counselor should know">
              <Textarea id="notes" rows={3} value={form.notes} onChange={set("notes")} />
            </Field>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit intake
            </Button>
          </form>
        </CardContent>
      </Card>
    </PageShell>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function Item({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/60 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value ?? "—"}</span>
    </div>
  );
}
