"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader, PageShell } from "@/components/shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { GraduationCap, Loader2, ExternalLink } from "lucide-react";

interface University {
  id: string;
  name: string;
  location: string | null;
  website: string | null;
  us_news_rank: number | null;
  cs_rank: number | null;
  research_status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  overview: string | null;
  tuition_per_year: number | null;
  living_cost_per_year: number | null;
  application_fee: number | null;
  programs: Array<{ name?: string; deadline?: string }> | null;
  deadlines: Array<{ program?: string; deadline?: string }> | null;
  requirements: Record<string, unknown> | null;
  sources: Array<{ name?: string; url?: string }> | null;
  updated_at: string;
}

const money = (n: number | null) => (n == null ? "—" : `$${Number(n).toLocaleString()}`);

export default function StudentUniversityResearchPage() {
  const { user } = useAuth();
  const [list, setList] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/student/universities");
      if (res.ok) setList((await res.json()) as University[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return list.filter(
      (u) => u.name.toLowerCase().includes(q) || (u.location || "").toLowerCase().includes(q)
    );
  }, [list, search]);

  if (loading) {
    return (
      <PageShell>
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="University research"
        description="Admin-verified information about universities. Do your own research too, but this data is checked."
      />
      <Input
        placeholder="Search universities…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 max-w-sm"
      />
      <div className="space-y-3">
        {filtered.map((u) => (
          <Card key={u.id}>
            <CardHeader className="cursor-pointer" onClick={() => setOpenId((id) => (id === u.id ? null : u.id))}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{u.name}</CardTitle>
                  <CardDescription>
                    {u.location}
                    {u.us_news_rank ? ` · #${u.us_news_rank} US News` : ""}
                    {u.cs_rank ? ` · #${u.cs_rank} CS` : ""}
                  </CardDescription>
                </div>
                <Badge
                  className={
                    u.research_status === "COMPLETED"
                      ? "bg-green-100 text-green-800"
                      : u.research_status === "IN_PROGRESS"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-100 text-slate-600"
                  }
                >
                  {u.research_status === "COMPLETED"
                    ? "verified"
                    : u.research_status === "IN_PROGRESS"
                    ? "in progress"
                    : "not yet researched"}
                </Badge>
              </div>
            </CardHeader>
            {openId === u.id && (
              <CardContent className="space-y-3 text-sm">
                {u.overview && <p className="text-muted-foreground">{u.overview}</p>}
                <div className="grid gap-2 sm:grid-cols-3">
                  <Stat label="Tuition / yr" value={money(u.tuition_per_year)} />
                  <Stat label="Living / yr" value={money(u.living_cost_per_year)} />
                  <Stat label="App fee" value={money(u.application_fee)} />
                </div>
                {u.programs && u.programs.length > 0 && (
                  <div>
                    <p className="font-medium">Programs</p>
                    <ul className="list-inside list-disc text-muted-foreground">
                      {u.programs.map((p, i) => (
                        <li key={i}>
                          {p.name}
                          {p.deadline ? ` — deadline ${p.deadline}` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {u.requirements && Object.keys(u.requirements).length > 0 && (
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Requirements: </span>
                    {Object.entries(u.requirements)
                      .filter(([, v]) => v)
                      .map(([k, v]) => `${k.toUpperCase()} ${v}`)
                      .join(" · ")}
                  </p>
                )}
                {u.sources && u.sources.length > 0 && (
                  <div>
                    <p className="font-medium">Sources</p>
                    <ul className="space-y-0.5">
                      {u.sources.map((s, i) => (
                        <li key={i} className="flex items-center gap-1 text-muted-foreground">
                          <ExternalLink className="h-3 w-3" /> {s.name || s.url}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Updated {new Date(u.updated_at).toLocaleDateString()}
                </p>
              </CardContent>
            )}
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No universities found.</p>
        )}
      </div>
    </PageShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border p-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
