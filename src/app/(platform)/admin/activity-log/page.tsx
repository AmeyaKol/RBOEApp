"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader, PageShell } from "@/components/shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  Clock,
  Loader2,
  MessageSquare,
  FileText,
  GraduationCap,
} from "lucide-react";
import type { AdminActivityItem, AdminActivityKind } from "@/lib/admin-activity";

const KIND_META: Record<
  AdminActivityKind,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  request: { label: "Requests", icon: MessageSquare },
  document: { label: "Documents", icon: FileText },
  application: { label: "Applications", icon: GraduationCap },
};

const FILTERS: Array<AdminActivityKind | "ALL"> = ["ALL", "request", "document", "application"];

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return "Today";
  if (same(d, yest)) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

export default function AdminActivityLogPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<AdminActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<AdminActivityKind | "ALL">("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/activity-log");
      if (!res.ok) throw new Error("Failed to load activity log");
      const data = (await res.json()) as { items: AdminActivityItem[] };
      setItems(data.items || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load activity log");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const visible = useMemo(
    () => (filter === "ALL" ? items : items.filter((i) => i.kind === filter)),
    [items, filter]
  );

  const groups = useMemo(() => {
    const map = new Map<string, AdminActivityItem[]>();
    for (const item of visible) {
      const key = dayLabel(item.at);
      const arr = map.get(key) ?? [];
      arr.push(item);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [visible]);

  return (
    <PageShell>
      <PageHeader
        title="Activity log"
        description="Recent student activity — document updates, new requests, and application changes across your assigned students."
        actions={
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Refresh
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
              filter === f
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {f === "ALL" ? "All activity" : KIND_META[f].label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Clock className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No activity to show.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {groups.map(([label, rows]) => (
            <div key={label}>
              <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </h2>
              <div className="space-y-2">
                {rows.map((a, i) => {
                  const Icon = KIND_META[a.kind].icon;
                  const inner = (
                    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent/40">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{a.text}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.detail} •{" "}
                          {new Date(a.at).toLocaleString(undefined, {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                  return a.studentId ? (
                    <Link key={i} href={`/admin/students/${a.studentId}`} className="block">
                      {inner}
                    </Link>
                  ) : (
                    <div key={i}>{inner}</div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
