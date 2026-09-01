"use client";

import { PageHeader, PageShell, PreviewBanner } from "@/components/shell";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <PageShell>
      <PageHeader
        title="Data analytics"
        description="Admissions funnel, acceptance rates, request SLAs, and revenue"
      />
      <PreviewBanner />
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <BarChart3 className="h-10 w-10 text-muted-foreground" />
          <p className="max-w-md text-sm text-muted-foreground">
            Frontend-only preview coming in this build: an admissions funnel, acceptance
            rate by university, request volume and response times, and a revenue view.
          </p>
        </CardContent>
      </Card>
    </PageShell>
  );
}
