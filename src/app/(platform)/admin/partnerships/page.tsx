"use client";

import { useMemo, useState } from "react";
import { PageHeader, PageShell, PreviewBanner } from "@/components/shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Ticket, Handshake, TrendingUp } from "lucide-react";

interface Coupon {
  code: string;
  owner: string;
  discountPct: number;
  referred: number;
  converted: number;
}

const SPONSORS = [
  { name: "HDFC Credila", kind: "Education loans", terms: "0.25% rate concession for RBOE students", status: "Active" },
  { name: "Prodigy Finance", kind: "No-cosigner loans", terms: "Waived admin fee", status: "Active" },
  { name: "Yocket Premium", kind: "Test prep", terms: "15% off GRE/TOEFL bundles", status: "Negotiating" },
  { name: "Fly.com Travel", kind: "Student airfare", terms: "Group fare desk for Aug intake", status: "Active" },
];

const CAMPAIGNS = [
  { name: "Fall 2026 referral push", reach: 4200, signups: 380, consults: 145, enrolled: 38 },
  { name: "IIT/NIT campus talks", reach: 1600, signups: 210, consults: 96, enrolled: 27 },
  { name: "Instagram — SOP tips series", reach: 9100, signups: 260, consults: 71, enrolled: 12 },
];

const INITIAL_COUPONS: Coupon[] = [
  { code: "PRIYA-2026", owner: "Priya Sharma", discountPct: 10, referred: 3, converted: 2 },
  { code: "ARJUN-REF", owner: "Arjun Patel", discountPct: 10, referred: 1, converted: 0 },
  { code: "ALUMNI-RK", owner: "Rajesh Kumar (alum)", discountPct: 15, referred: 6, converted: 4 },
];

const randomCode = (name: string) =>
  `${name.split(" ")[0].toUpperCase().slice(0, 6)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

export default function PartnershipsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>(INITIAL_COUPONS);
  const [owner, setOwner] = useState("");
  const [pct, setPct] = useState("10");

  const totals = useMemo(
    () => ({
      referred: coupons.reduce((s, c) => s + c.referred, 0),
      converted: coupons.reduce((s, c) => s + c.converted, 0),
      enrolled: CAMPAIGNS.reduce((s, c) => s + c.enrolled, 0),
    }),
    [coupons]
  );

  const addCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!owner.trim()) return;
    setCoupons((c) => [
      { code: randomCode(owner), owner: owner.trim(), discountPct: Number(pct) || 10, referred: 0, converted: 0 },
      ...c,
    ]);
    setOwner("");
  };

  return (
    <PageShell>
      <PageHeader
        title="Partnerships & promotions"
        description="Referral coupons, sponsor relationships, and campaign performance"
      />
      <PreviewBanner />

      <div className="mb-6 grid grid-cols-3 gap-4">
        {[
          { label: "Referrals tracked", value: totals.referred, icon: Ticket },
          { label: "Referral conversions", value: totals.converted, icon: TrendingUp },
          { label: "Sponsors", value: SPONSORS.filter((s) => s.status === "Active").length, icon: Handshake },
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Referral coupons</CardTitle>
            <CardDescription>Generate a code for a student or alum to share.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={addCoupon} className="flex flex-wrap items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="owner">Owner</Label>
                <Input
                  id="owner"
                  placeholder="Student or alum name"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                />
              </div>
              <div className="w-24 space-y-1.5">
                <Label htmlFor="pct">Discount %</Label>
                <Input id="pct" type="number" value={pct} onChange={(e) => setPct(e.target.value)} />
              </div>
              <Button type="submit">Generate</Button>
            </form>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3">Code</th>
                  <th className="py-2 pr-3">Owner</th>
                  <th className="py-2 pr-3">Disc.</th>
                  <th className="py-2 pr-3">Referred</th>
                  <th className="py-2">Converted</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.code} className="border-b last:border-0">
                    <td className="py-2 pr-3 font-mono text-xs">{c.code}</td>
                    <td className="py-2 pr-3">{c.owner}</td>
                    <td className="py-2 pr-3">{c.discountPct}%</td>
                    <td className="py-2 pr-3">{c.referred}</td>
                    <td className="py-2">{c.converted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sponsors & partners</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {SPONSORS.map((s) => (
              <div key={s.name} className="rounded-lg border p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-medium">{s.name}</span>
                  <Badge
                    className={
                      s.status === "Active"
                        ? "bg-green-100 text-green-800"
                        : "bg-amber-100 text-amber-800"
                    }
                  >
                    {s.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {s.kind} · {s.terms}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Campaign funnels</CardTitle>
          <CardDescription>Reach → sign-up → consultation → enrolled (sample figures).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {CAMPAIGNS.map((c) => {
            const steps = [
              { label: "Reach", v: c.reach },
              { label: "Sign-ups", v: c.signups },
              { label: "Consults", v: c.consults },
              { label: "Enrolled", v: c.enrolled },
            ];
            return (
              <div key={c.name}>
                <p className="mb-2 text-sm font-medium">{c.name}</p>
                <div className="space-y-1">
                  {steps.map((s) => (
                    <div key={s.label} className="flex items-center gap-3 text-xs">
                      <span className="w-20 text-muted-foreground">{s.label}</span>
                      <div className="h-4 flex-1 rounded bg-muted">
                        <div
                          className="h-4 rounded bg-[#3b7dd8]"
                          style={{ width: `${Math.max(3, (s.v / c.reach) * 100)}%` }}
                        />
                      </div>
                      <span className="w-14 text-right tabular-nums">{s.v.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </PageShell>
  );
}
