"use client";

import { PageHeader, PageShell } from "@/components/shell";
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";

export default function AdminActivityLogPage() {
  return (
    <PageShell>
      <PageHeader
        title="Activity log"
        description="Recent student activity — document updates, new requests, application changes"
      />
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Clock className="h-10 w-10 text-muted-foreground" />
          <p className="max-w-md text-sm text-muted-foreground">
            Coming in this build: a reverse-chronological feed built from recent request,
            document, and application changes across your assigned students.
          </p>
        </CardContent>
      </Card>
    </PageShell>
  );
}
