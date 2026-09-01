"use client";

import { PageHeader, PageShell } from "@/components/shell";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";

export default function AdminCalendarPage() {
  return (
    <PageShell>
      <PageHeader
        title="Calendar"
        description="Application deadlines, recommended transcript / LOR dates, and visa slots across your students"
      />
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <CalendarDays className="h-10 w-10 text-muted-foreground" />
          <p className="max-w-md text-sm text-muted-foreground">
            Coming in this build: a month view aggregating application deadlines, visa mock
            interviews, and recommended prep dates for every assigned student.
          </p>
        </CardContent>
      </Card>
    </PageShell>
  );
}
