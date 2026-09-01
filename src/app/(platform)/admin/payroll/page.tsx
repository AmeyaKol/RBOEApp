"use client";

import { useMemo, useState } from "react";
import { PageHeader, PageShell, PreviewBanner } from "@/components/shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, CheckCircle2, Wallet } from "lucide-react";

interface StaffMember {
  id: string;
  name: string;
  role: string;
  type: "Full-time" | "Contract";
  monthly: number; // base monthly pay (INR)
  hours: number; // logged this cycle
  status: "Pending" | "Paid";
}

const CYCLE = "September 2026";

const INITIAL: StaffMember[] = [
  { id: "1", name: "Rajiv Menon", role: "Founder & Senior Counselor", type: "Full-time", monthly: 180000, hours: 176, status: "Pending" },
  { id: "2", name: "Neha Kapoor", role: "Admissions Counselor", type: "Full-time", monthly: 95000, hours: 168, status: "Pending" },
  { id: "3", name: "Sameer Rao", role: "Admissions Counselor", type: "Full-time", monthly: 95000, hours: 172, status: "Pending" },
  { id: "4", name: "Ishita Bose", role: "SOP Editor", type: "Contract", monthly: 60000, hours: 120, status: "Pending" },
  { id: "5", name: "Farhan Qureshi", role: "Visa Specialist", type: "Contract", monthly: 55000, hours: 96, status: "Pending" },
  { id: "6", name: "Divya Nair", role: "Operations", type: "Full-time", monthly: 70000, hours: 176, status: "Pending" },
];

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function PayrollPage() {
  const [staff, setStaff] = useState<StaffMember[]>(INITIAL);
  const [running, setRunning] = useState(false);
  const [payslip, setPayslip] = useState<StaffMember | null>(null);

  const totals = useMemo(() => {
    const gross = staff.reduce((s, m) => s + m.monthly, 0);
    const paid = staff.filter((m) => m.status === "Paid").length;
    return { gross, paid, headcount: staff.length };
  }, [staff]);

  const runPayroll = async () => {
    setRunning(true);
    for (const m of staff) {
      await new Promise((r) => setTimeout(r, 350));
      setStaff((prev) => prev.map((x) => (x.id === m.id ? { ...x, status: "Paid" } : x)));
    }
    setRunning(false);
  };

  const reset = () => setStaff(INITIAL.map((m) => ({ ...m, status: "Pending" })));

  return (
    <PageShell>
      <PageHeader
        title="Payroll"
        description={`Staff roster and the ${CYCLE} payroll run`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={reset} disabled={running}>
              Reset
            </Button>
            <Button onClick={runPayroll} disabled={running || totals.paid === totals.headcount}>
              {running ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Run payroll
            </Button>
          </div>
        }
      />
      <PreviewBanner />

      <div className="mb-6 grid grid-cols-3 gap-4">
        {[
          { label: "Headcount", value: String(totals.headcount) },
          { label: "Gross this cycle", value: inr(totals.gross) },
          { label: "Paid", value: `${totals.paid} / ${totals.headcount}` },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-6">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roster — {CYCLE}</CardTitle>
          <CardDescription>Base pay is monthly; hours are logged for the cycle.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Hours</th>
                <th className="py-2 pr-4">Base pay</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {staff.map((m) => (
                <tr key={m.id} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium">{m.name}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{m.role}</td>
                  <td className="py-2 pr-4">{m.type}</td>
                  <td className="py-2 pr-4">{m.hours}</td>
                  <td className="py-2 pr-4">{inr(m.monthly)}</td>
                  <td className="py-2 pr-4">
                    {m.status === "Paid" ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Paid
                      </Badge>
                    ) : (
                      <Badge className="bg-slate-100 text-slate-600">Pending</Badge>
                    )}
                  </td>
                  <td className="py-2 text-right">
                    <Button size="sm" variant="outline" onClick={() => setPayslip(m)}>
                      Payslip
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {payslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Wallet className="h-4 w-4" /> Payslip — {CYCLE}
              </CardTitle>
              <CardDescription>{payslip.name} · {payslip.role}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Line label="Base pay" value={inr(payslip.monthly)} />
              <Line label="Hours logged" value={String(payslip.hours)} />
              <Line label="PF (12%)" value={`- ${inr(Math.round(payslip.monthly * 0.12))}`} />
              <Line label="TDS (10%)" value={`- ${inr(Math.round(payslip.monthly * 0.1))}`} />
              <div className="border-t pt-2">
                <Line
                  label="Net pay"
                  value={inr(Math.round(payslip.monthly * 0.78))}
                  bold
                />
              </div>
              <p className="pt-2 text-xs text-muted-foreground">
                Illustrative figures — this preview does not compute real payroll.
              </p>
              <div className="flex justify-end">
                <Button variant="ghost" onClick={() => setPayslip(null)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageShell>
  );
}

function Line({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold" : ""}`}>
      <span className={bold ? "" : "text-muted-foreground"}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
