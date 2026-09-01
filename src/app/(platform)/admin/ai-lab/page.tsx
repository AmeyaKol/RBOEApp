"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PageHeader, PageShell, PreviewBanner } from "@/components/shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Sparkles, Loader2, Wand2, Check } from "lucide-react";

interface StudentRow {
  user_id: string;
  full_name: string;
  gre_score: number | null;
  toefl_score: number | null;
  undergrad_gpa: number | null;
  work_experience_months: number | null;
  target_degree: string | null;
}

// Fixed reference list with a rough selectivity weight (0 = safe, 1 = reach).
const UNIVERSITIES: Array<{ name: string; selectivity: number }> = [
  { name: "Stanford University", selectivity: 0.97 },
  { name: "Massachusetts Institute of Technology", selectivity: 0.97 },
  { name: "Carnegie Mellon University", selectivity: 0.88 },
  { name: "UC Berkeley", selectivity: 0.86 },
  { name: "Georgia Institute of Technology", selectivity: 0.72 },
  { name: "University of Michigan, Ann Arbor", selectivity: 0.68 },
  { name: "University of Texas at Austin", selectivity: 0.66 },
  { name: "University of Illinois Urbana-Champaign", selectivity: 0.6 },
  { name: "Arizona State University", selectivity: 0.32 },
  { name: "University of Massachusetts Amherst", selectivity: 0.4 },
];

/** Deterministic 0–1 profile strength from GRE / GPA / TOEFL / experience. */
function profileScore(s: StudentRow) {
  const gre = ((s.gre_score ?? 300) - 290) / 50; // 290→0, 340→1
  const gpa = (s.undergrad_gpa ?? 3) / 4;
  const toefl = ((s.toefl_score ?? 90) - 80) / 40;
  const exp = Math.min(1, (s.work_experience_months ?? 0) / 36);
  return Math.max(0, Math.min(1, 0.4 * gre + 0.35 * gpa + 0.15 * toefl + 0.1 * exp));
}

function bucketFor(strength: number, selectivity: number) {
  // admit chance ~ how far the student's strength clears the bar
  const chance = Math.max(0.02, Math.min(0.97, 0.5 + (strength - selectivity) * 1.4));
  if (chance >= 0.7) return { bucket: "Safe" as const, chance };
  if (chance >= 0.4) return { bucket: "Moderate" as const, chance };
  return { bucket: "Ambitious" as const, chance };
}

const BUCKET_META = {
  Safe: "border-green-200 bg-green-50",
  Moderate: "border-amber-200 bg-amber-50",
  Ambitious: "border-rose-200 bg-rose-50",
};

export default function AiLabPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentRow[]>([]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/admin/students")
      .then((r) => (r.ok ? r.json() : []))
      .then(setStudents)
      .catch(() => setStudents([]));
  }, [user]);

  return (
    <PageShell>
      <PageHeader
        title="AI Lab"
        description="A simulated preview of the AI college-prediction engine and the SOP / LOR assistant"
      />
      <PreviewBanner>
        <span className="font-medium">Preview.</span> These tools produce deterministic, template-driven
        output to show the intended workflow. No external model is called.
      </PreviewBanner>

      <Tabs defaultValue="predict" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="predict">College prediction</TabsTrigger>
          <TabsTrigger value="draft">SOP / LOR assistant</TabsTrigger>
        </TabsList>
        <TabsContent value="predict">
          <PredictionEngine students={students} />
        </TabsContent>
        <TabsContent value="draft">
          <DraftAssistant students={students} />
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}

function PredictionEngine({ students }: { students: StudentRow[] }) {
  const [selected, setSelected] = useState<string>("");
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  const student = students.find((s) => s.user_id === selected) ?? null;

  const results = useMemo(() => {
    if (!student) return [];
    const strength = profileScore(student);
    return UNIVERSITIES.map((u) => {
      const { bucket, chance } = bucketFor(strength, u.selectivity);
      return { ...u, bucket, chance };
    }).sort((a, b) => b.chance - a.chance);
  }, [student]);

  const run = async () => {
    setAnalyzing(true);
    setDone(false);
    setProgress(0);
    for (let p = 0; p <= 100; p += 8) {
      await new Promise((r) => setTimeout(r, 90));
      setProgress(p);
    }
    setProgress(100);
    setAnalyzing(false);
    setDone(true);
  };

  const byBucket = (b: string) => results.filter((r) => r.bucket === b);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select a student</CardTitle>
          <CardDescription>The engine scores their profile against the reference university list.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <select
            className="min-w-[220px] rounded-md border p-2 text-sm"
            value={selected}
            onChange={(e) => {
              setSelected(e.target.value);
              setDone(false);
            }}
          >
            <option value="">Choose…</option>
            {students.map((s) => (
              <option key={s.user_id} value={s.user_id}>
                {s.full_name}
              </option>
            ))}
          </select>
          {student && (
            <span className="text-xs text-muted-foreground">
              GRE {student.gre_score ?? "—"} · GPA {student.undergrad_gpa ?? "—"} · TOEFL{" "}
              {student.toefl_score ?? "—"} · {student.work_experience_months ?? 0} mo exp
            </span>
          )}
          <Button onClick={run} disabled={!student || analyzing}>
            {analyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Analyze
          </Button>
        </CardContent>
      </Card>

      {analyzing && (
        <div className="h-2 w-full overflow-hidden rounded bg-muted">
          <div className="h-2 rounded bg-[#3b7dd8] transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}

      {done && student && (
        <div className="grid gap-4 md:grid-cols-3">
          {(["Safe", "Moderate", "Ambitious"] as const).map((b) => (
            <Card key={b} className={BUCKET_META[b]}>
              <CardHeader>
                <CardTitle className="text-sm">
                  {b} choices
                  <Badge variant="outline" className="ml-2">
                    {byBucket(b).length}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {b === "Safe"
                    ? "≥ 70% predicted admit chance"
                    : b === "Moderate"
                    ? "40–70%"
                    : "< 40% — worth a shot"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {byBucket(b).map((r) => (
                  <div key={r.name} className="rounded border bg-card p-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{r.name}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {Math.round(r.chance * 100)}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Profile strength vs. program selectivity
                    </p>
                  </div>
                ))}
                {byBucket(b).length === 0 && (
                  <p className="text-xs text-muted-foreground">None in this band.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {done && (
        <p className="text-xs text-muted-foreground">
          Rajiv can use this as a first pass, then hand-pick the shortlist.
        </p>
      )}
    </div>
  );
}

const SUGGESTION_BANK = [
  {
    kind: "improvement",
    confidence: 91,
    text: "Open with a concrete moment from your research instead of a general statement of interest.",
    apply: (d: string) =>
      "During my final-year project I spent three weeks chasing a race condition in a distributed queue — that hunt is why I want to study systems.\n\n" +
      d,
  },
  {
    kind: "structure",
    confidence: 84,
    text: "Move the paragraph about your target program's faculty to right after your research summary.",
    apply: (d: string) => d + "\n\n[Faculty paragraph moved up: name two professors and the course sequence.]",
  },
  {
    kind: "content",
    confidence: 78,
    text: "Quantify your internship impact — a number makes the claim land.",
    apply: (d: string) => d.replace(/\[contribution\]/g, "cut p99 latency by 38%"),
  },
  {
    kind: "clarity",
    confidence: 73,
    text: "Tighten the closing paragraph to two sentences on fit and goals.",
    apply: (d: string) => d + "\n\n[Closing tightened: one sentence on fit, one on the 5-year goal.]",
  },
];

function DraftAssistant({ students }: { students: StudentRow[] }) {
  const [selected, setSelected] = useState("");
  const [draft, setDraft] = useState(
    "I am applying for a Master's in Computer Science to deepen my foundation in distributed systems. During my undergraduate studies I built [project] and interned at [company], where I owned [contribution]. My goal is to work on large-scale infrastructure."
  );
  const [applied, setApplied] = useState<number[]>([]);
  const [streaming, setStreaming] = useState(false);
  const streamRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const student = students.find((s) => s.user_id === selected) ?? null;

  const analyze = useCallback(() => {
    if (streaming) return;
    setStreaming(true);
    const name = student?.full_name ?? "the applicant";
    const full =
      `Analysis for ${name}\n\n` +
      `Strengths: clear technical direction; relevant internship; quantifiable coursework.\n` +
      `Gaps: the opening is generic; impact is unquantified; the program-fit paragraph is buried.\n` +
      `Recommended edits are listed on the right with confidence scores. Apply the ones you agree with.`;
    let i = 0;
    setDraft("");
    const tick = () => {
      i += 3;
      setDraft(full.slice(0, i));
      if (i < full.length) {
        streamRef.current = setTimeout(tick, 16);
      } else {
        setStreaming(false);
      }
    };
    tick();
  }, [streaming, student]);

  const applySuggestion = (idx: number) => {
    if (applied.includes(idx)) return;
    setDraft((d) => SUGGESTION_BANK[idx].apply(d));
    setApplied((a) => [...a, idx]);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base">Document editor</CardTitle>
              <div className="flex items-center gap-2">
                <select
                  className="rounded-md border p-1.5 text-sm"
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                >
                  <option value="">No student context</option>
                  {students.map((s) => (
                    <option key={s.user_id} value={s.user_id}>
                      {s.full_name}
                    </option>
                  ))}
                </select>
                <Button size="sm" onClick={analyze} disabled={streaming}>
                  {streaming ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="mr-2 h-4 w-4" />
                  )}
                  Analyze with AI
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="min-h-[320px] text-sm leading-relaxed"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {draft.trim().split(/\s+/).filter(Boolean).length} words · simulated assistant
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI suggestions</CardTitle>
          <CardDescription>Confidence-scored. Apply the ones you agree with.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {SUGGESTION_BANK.map((s, i) => (
            <div key={i} className="rounded-lg border p-3">
              <div className="mb-1 flex items-center justify-between">
                <Badge variant="outline" className="capitalize">
                  {s.kind}
                </Badge>
                <span className="text-xs text-muted-foreground">{s.confidence}% confidence</span>
              </div>
              <p className="text-sm">{s.text}</p>
              <Button
                size="sm"
                variant={applied.includes(i) ? "outline" : "default"}
                className="mt-2"
                onClick={() => applySuggestion(i)}
                disabled={applied.includes(i)}
              >
                {applied.includes(i) ? (
                  <>
                    <Check className="mr-1 h-3.5 w-3.5" /> Applied
                  </>
                ) : (
                  "Apply"
                )}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
