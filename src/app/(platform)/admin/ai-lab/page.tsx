"use client";

import { PageHeader, PageShell, PreviewBanner } from "@/components/shell";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export default function AiLabPage() {
  return (
    <PageShell>
      <PageHeader
        title="AI Lab"
        description="Simulated AI college-prediction engine and SOP / LOR drafting assistant"
      />
      <PreviewBanner>
        <span className="font-medium">Preview.</span> These tools simulate an AI workflow
        with deterministic, template-driven output. No external model is called.
      </PreviewBanner>
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Sparkles className="h-10 w-10 text-muted-foreground" />
          <p className="max-w-md text-sm text-muted-foreground">
            Coming in this build: a college-prediction engine that buckets universities into
            Safe / Moderate / Ambitious with confidence scores from a student&apos;s profile,
            and an SOP/LOR editor with a simulated &quot;Analyze with AI&quot; pass and
            confidence-scored suggestions.
          </p>
        </CardContent>
      </Card>
    </PageShell>
  );
}
