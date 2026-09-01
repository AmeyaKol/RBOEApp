"use client";

import { PageHeader, PageShell, PreviewBanner } from "@/components/shell";
import { Card, CardContent } from "@/components/ui/card";
import { Megaphone } from "lucide-react";

export default function PartnershipsPage() {
  return (
    <PageShell>
      <PageHeader
        title="Partnerships & promotions"
        description="Referral coupons, sponsor relationships, and promotional campaigns"
      />
      <PreviewBanner />
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Megaphone className="h-10 w-10 text-muted-foreground" />
          <p className="max-w-md text-sm text-muted-foreground">
            Frontend-only preview coming in this build: referral coupon generator and
            tracker, sponsor list (e.g. education-loan partners), and campaign funnels — all
            sample data.
          </p>
        </CardContent>
      </Card>
    </PageShell>
  );
}
