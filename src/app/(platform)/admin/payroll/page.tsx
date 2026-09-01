"use client";

import { PageHeader, PageShell, PreviewBanner } from "@/components/shell";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet } from "lucide-react";

export default function PayrollPage() {
  return (
    <PageShell>
      <PageHeader
        title="Payroll"
        description="Staff roster, monthly payroll runs, and payslips"
      />
      <PreviewBanner />
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Wallet className="h-10 w-10 text-muted-foreground" />
          <p className="max-w-md text-sm text-muted-foreground">
            Frontend-only preview coming in this build: counselor roster with salary and
            hours, a monthly payroll run table, and a payslip view — all sample data.
          </p>
        </CardContent>
      </Card>
    </PageShell>
  );
}
