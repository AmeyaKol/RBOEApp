"use client";

import { PageHeader, PageShell, PreviewBanner } from "@/components/shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Single accent hue for magnitude (sequential job); text stays in ink tokens.
const HUE = "#3b7dd8";

const FUNNEL = [
  { label: "Leads", value: 640 },
  { label: "Consultations", value: 312 },
  { label: "Onboarded", value: 188 },
  { label: "Applied", value: 164 },
  { label: "Admitted", value: 121 },
  { label: "Enrolled abroad", value: 98 },
];

const ACCEPTANCE = [
  { label: "Arizona State", value: 82 },
  { label: "Georgia Tech", value: 61 },
  { label: "UT Austin", value: 44 },
  { label: "UMich Ann Arbor", value: 39 },
  { label: "CMU", value: 33 },
  { label: "Stanford", value: 12 },
];

const REQUESTS_BY_URGENCY = [
  { label: "Low", value: 46 },
  { label: "Normal", value: 121 },
  { label: "High", value: 58 },
  { label: "Critical", value: 19 },
];

const REVENUE = [
  { m: "Mar", v: 12.4 },
  { m: "Apr", v: 14.1 },
  { m: "May", v: 15.9 },
  { m: "Jun", v: 15.2 },
  { m: "Jul", v: 18.7 },
  { m: "Aug", v: 22.3 },
];

export default function AnalyticsPage() {
  return (
    <PageShell>
      <PageHeader
        title="Data analytics"
        description="Admissions funnel, acceptance rates, request load, and revenue"
      />
      <PreviewBanner>
        <span className="font-medium">Preview.</span> Figures are illustrative sample data, not a
        live query.
      </PreviewBanner>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Admissions funnel</CardTitle>
            <CardDescription>This cycle, lead → enrolled abroad</CardDescription>
          </CardHeader>
          <CardContent>
            <BarList rows={FUNNEL} max={FUNNEL[0].value} suffix="" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acceptance rate by university</CardTitle>
            <CardDescription>Share of RBOE applicants admitted</CardDescription>
          </CardHeader>
          <CardContent>
            <BarList rows={ACCEPTANCE} max={100} suffix="%" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Requests by urgency</CardTitle>
            <CardDescription>Volume over the last 90 days</CardDescription>
          </CardHeader>
          <CardContent>
            <BarList rows={REQUESTS_BY_URGENCY} max={Math.max(...REQUESTS_BY_URGENCY.map((r) => r.value))} suffix="" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
            <CardDescription>Monthly, ₹ lakh</CardDescription>
          </CardHeader>
          <CardContent>
            <LineChart data={REVENUE} />
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

function BarList({
  rows,
  max,
  suffix,
}: {
  rows: Array<{ label: string; value: number }>;
  max: number;
  suffix: string;
}) {
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3 text-sm">
          <span className="w-32 shrink-0 text-muted-foreground">{r.label}</span>
          <div className="h-5 flex-1 rounded bg-muted">
            <div
              className="h-5 rounded"
              style={{ width: `${Math.max(2, (r.value / max) * 100)}%`, backgroundColor: HUE }}
            />
          </div>
          <span className="w-14 text-right font-medium tabular-nums">
            {r.value}
            {suffix}
          </span>
        </div>
      ))}
    </div>
  );
}

function LineChart({ data }: { data: Array<{ m: string; v: number }> }) {
  const W = 460;
  const H = 180;
  const pad = { l: 32, r: 12, t: 12, b: 24 };
  const max = Math.ceil(Math.max(...data.map((d) => d.v)) / 5) * 5;
  const x = (i: number) => pad.l + (i * (W - pad.l - pad.r)) / (data.length - 1);
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const path = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(d.v)}`).join(" ");

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[360px]" role="img" aria-label="Monthly revenue line chart">
        {[0, max / 2, max].map((g) => (
          <g key={g}>
            <line x1={pad.l} x2={W - pad.r} y1={y(g)} y2={y(g)} className="stroke-border" strokeWidth={1} />
            <text x={0} y={y(g) + 3} className="fill-muted-foreground text-[10px]">
              {g}
            </text>
          </g>
        ))}
        <path d={path} fill="none" stroke={HUE} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => (
          <g key={d.m}>
            <circle cx={x(i)} cy={y(d.v)} r={3.5} fill={HUE} />
            <text x={x(i)} y={H - 8} textAnchor="middle" className="fill-muted-foreground text-[10px]">
              {d.m}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
