"use client";

import { PageHeader, PageShell } from "@/components/shell";
import { Card, CardContent } from "@/components/ui/card";
import { Plane } from "lucide-react";

export default function VisaSchedulingPage() {
  return (
    <PageShell>
      <PageHeader
        title="Visa mock interview scheduling"
        description="Track student visa slots and schedule mock interviews with the counseling team"
      />
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Plane className="h-10 w-10 text-muted-foreground" />
          <p className="max-w-md text-sm text-muted-foreground">
            Coming in this build: a date-sorted table of every student&apos;s visa slot, a
            scheduling action that assigns an interviewer and meeting link, and completion
            notes. Scheduling and notification only — the interview itself runs on Zoom/Meet.
          </p>
        </CardContent>
      </Card>
    </PageShell>
  );
}
