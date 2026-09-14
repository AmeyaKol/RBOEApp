"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader, PageShell } from "@/components/shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { CalendarDays, GraduationCap, Loader2, Plane } from "lucide-react";
import type { CalendarItem, CalendarItemKind } from "@/app/api/admin/calendar/route";

const KIND_META: Record<
  CalendarItemKind,
  { label: string; icon: React.ComponentType<{ className?: string }>; dot: string }
> = {
  deadline: { label: "Deadlines", icon: GraduationCap, dot: "bg-rose-500" },
  visa: { label: "Visa", icon: Plane, dot: "bg-blue-500" },
};

const FILTERS: Array<CalendarItemKind | "ALL"> = ["ALL", "deadline", "visa"];

const todayKey = () => new Date().toISOString().slice(0, 10);

function relativeDays(dateKey: string): string {
  const days = Math.ceil(
    (new Date(dateKey + "T00:00:00").getTime() - new Date(todayKey() + "T00:00:00").getTime()) /
      86_400_000
  );
  if (days < 0) return `${Math.abs(days)}d ago`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `in ${days}d`;
}

export default function AdminCalendarPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<CalendarItemKind | "ALL">("ALL");
  const [showPast, setShowPast] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/calendar");
      if (!res.ok) throw new Error("Failed to load calendar");
      const data = (await res.json()) as { items: CalendarItem[] };
      setItems(data.items || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load calendar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const visible = useMemo(() => {
    const today = todayKey();
    return items.filter((i) => {
      if (filter !== "ALL" && i.kind !== filter) return false;
      if (!showPast && i.date < today) return false;
      return true;
    });
  }, [items, filter, showPast]);

  // Group by month → date.
  const months = useMemo(() => {
    const byMonth = new Map<string, Map<string, CalendarItem[]>>();
    for (const item of visible) {
      const monthKey = item.date.slice(0, 7);
      const dayMap = byMonth.get(monthKey) ?? new Map<string, CalendarItem[]>();
      const arr = dayMap.get(item.date) ?? [];
      arr.push(item);
      dayMap.set(item.date, arr);
      byMonth.set(monthKey, dayMap);
    }
    return Array.from(byMonth.entries()).map(([monthKey, dayMap]) => ({
      monthKey,
      monthLabel: new Date(monthKey + "-01T00:00:00").toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      }),
      days: Array.from(dayMap.entries()),
    }));
  }, [visible]);

  const counts = useMemo(() => {
    const today = todayKey();
    const upcoming = items.filter((i) => i.date >= today);
    return {
      deadlines: upcoming.filter((i) => i.kind === "deadline").length,
      visa: upcoming.filter((i) => i.kind === "visa").length,
    };
  }, [items]);

  return (
    <PageShell>
      <PageHeader
        title="Calendar"
        description="Application deadlines and visa mock interview slots across every assigned student, in date order."
        actions={
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Refresh
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
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
            {f === "ALL"
              ? `All (${counts.deadlines + counts.visa} upcoming)`
              : `${KIND_META[f].label} (${f === "deadline" ? counts.deadlines : counts.visa})`}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowPast((v) => !v)}
          className={`ml-auto rounded-full border px-3 py-1 text-sm transition-colors ${
            showPast
              ? "border-foreground bg-foreground text-background"
              : "border-border text-muted-foreground hover:bg-muted"
          }`}
        >
          {showPast ? "Showing past" : "Show past"}
        </button>
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
            <CalendarDays className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nothing scheduled{filter !== "ALL" ? ` for ${KIND_META[filter as CalendarItemKind].label.toLowerCase()}` : ""}
              {showPast ? "" : " ahead"}.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-10">
          {months.map(({ monthKey, monthLabel, days }) => (
            <div key={monthKey}>
              <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                {monthLabel}
              </h2>
              <div className="space-y-4">
                {days.map(([dateKey, rows]) => {
                  const d = new Date(dateKey + "T00:00:00");
                  const isPast = dateKey < todayKey();
                  return (
                    <div key={dateKey} className="flex gap-4">
                      <div className="w-14 shrink-0 text-center">
                        <div className="text-xs uppercase text-muted-foreground">
                          {d.toLocaleDateString(undefined, { weekday: "short" })}
                        </div>
                        <div className="text-xl font-semibold text-foreground">{d.getDate()}</div>
                        <div className={`text-[11px] ${isPast ? "text-muted-foreground" : "text-primary"}`}>
                          {relativeDays(dateKey)}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1 space-y-2">
                        {rows.map((item, i) => {
                          const Icon = KIND_META[item.kind].icon;
                          const inner = (
                            <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent/40">
                              <span
                                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${KIND_META[item.kind].dot}`}
                                aria-hidden
                              />
                              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-foreground">{item.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {item.studentName}
                                  {item.subtitle ? ` • ${item.subtitle}` : ""}
                                  {item.at
                                    ? ` • ${new Date(item.at).toLocaleTimeString(undefined, {
                                        hour: "numeric",
                                        minute: "2-digit",
                                      })}`
                                    : ""}
                                </p>
                              </div>
                              {item.status && (
                                <Badge variant="outline" className="shrink-0 text-[10px]">
                                  {item.status.replace(/_/g, " ").toLowerCase()}
                                </Badge>
                              )}
                            </div>
                          );
                          return item.studentId ? (
                            <Link
                              key={i}
                              href={`/admin/students/${item.studentId}`}
                              className="block"
                            >
                              {inner}
                            </Link>
                          ) : (
                            <div key={i}>{inner}</div>
                          );
                        })}
                      </div>
                    </div>
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
