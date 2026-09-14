"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader, PageShell } from "@/components/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { GraduationCap, Loader2, Plus, Save, Trash2 } from "lucide-react";

type ResearchStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";

interface University {
  id: string;
  name: string;
  location: string | null;
  website: string | null;
  us_news_rank: number | null;
  cs_rank: number | null;
  research_status: ResearchStatus;
  overview: string | null;
  tuition_per_year: number | null;
  living_cost_per_year: number | null;
  application_fee: number | null;
  programs: Array<{ name?: string; deadline?: string }> | null;
  deadlines: Array<{ program?: string; deadline?: string; priority?: string }> | null;
  requirements: { gre?: string; toefl?: string; gpa?: string; lors?: number | string } | null;
  sources: Array<{ name?: string; url?: string }> | null;
  updated_at: string;
}

const STATUS_BADGE: Record<ResearchStatus, string> = {
  PENDING: "bg-slate-100 text-slate-600",
  IN_PROGRESS: "bg-amber-100 text-amber-800",
  COMPLETED: "bg-green-100 text-green-800",
};

export default function UniversityResearchPage() {
  const { user } = useAuth();
  const [list, setList] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<University | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/universities");
      if (!res.ok) throw new Error("Failed to load universities");
      const data = (await res.json()) as University[];
      setList(data);
      setSelectedId((cur) => cur ?? data[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  useEffect(() => {
    const sel = list.find((u) => u.id === selectedId) ?? null;
    setDraft(sel ? structuredClone(sel) : null);
    setSavedMsg(null);
  }, [selectedId, list]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return list.filter(
      (u) => u.name.toLowerCase().includes(q) || (u.location || "").toLowerCase().includes(q)
    );
  }, [list, search]);

  const patch = (p: Partial<University>) => setDraft((d) => (d ? { ...d, ...p } : d));

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    setError(null);
    setSavedMsg(null);
    try {
      const res = await fetch("/api/admin/universities", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: draft.id,
          name: draft.name,
          location: draft.location,
          website: draft.website,
          us_news_rank: draft.us_news_rank ? Number(draft.us_news_rank) : null,
          cs_rank: draft.cs_rank ? Number(draft.cs_rank) : null,
          research_status: draft.research_status,
          overview: draft.overview,
          tuition_per_year: draft.tuition_per_year ? Number(draft.tuition_per_year) : null,
          living_cost_per_year: draft.living_cost_per_year ? Number(draft.living_cost_per_year) : null,
          application_fee: draft.application_fee ? Number(draft.application_fee) : null,
          programs: (draft.programs || []).filter((p) => p.name),
          deadlines: (draft.deadlines || []).filter((d) => d.program),
          requirements: draft.requirements || {},
          sources: (draft.sources || []).filter((s) => s.name || s.url),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Save failed");
      setSavedMsg("Research saved.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const addUniversity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/universities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), research_status: "PENDING" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add");
      setNewName("");
      setAdding(false);
      await load();
      setSelectedId(data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add");
    } finally {
      setSaving(false);
    }
  };

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
        description="Admin-verified university information that students can trust. Aggregate from Shiksha, US News, CSRankings, and official sites."
        actions={
          <Button onClick={() => setAdding((s) => !s)}>
            <Plus className="mr-2 h-4 w-4" /> Add university
          </Button>
        }
      />
      {error && (
        <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {adding && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <form onSubmit={addUniversity} className="flex gap-2">
              <Input
                placeholder="University name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
              <Button type="submit" disabled={saving}>
                Add
              </Button>
              <Button type="button" variant="outline" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Universities</CardTitle>
              <Input
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mt-2"
              />
            </CardHeader>
            <CardContent className="space-y-2">
              {filtered.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setSelectedId(u.id)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    selectedId === u.id ? "border-primary bg-accent/30" : "hover:border-border"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="font-medium">{u.name}</span>
                    <Badge className={STATUS_BADGE[u.research_status]}>
                      {u.research_status.replace("_", " ").toLowerCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {u.location}
                    {u.us_news_rank ? ` · #${u.us_news_rank} US News` : ""}
                  </p>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {!draft ? (
            <Card>
              <CardContent className="flex h-64 items-center justify-center text-center text-sm text-muted-foreground">
                <GraduationCap className="mr-2 h-5 w-5" /> Select a university to research
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{draft.name}</span>
                  <select
                    className="rounded-md border p-1.5 text-sm font-normal"
                    value={draft.research_status}
                    onChange={(e) => patch({ research_status: e.target.value as ResearchStatus })}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Location">
                    <Input value={draft.location ?? ""} onChange={(e) => patch({ location: e.target.value })} />
                  </Field>
                  <Field label="Website">
                    <Input value={draft.website ?? ""} onChange={(e) => patch({ website: e.target.value })} />
                  </Field>
                  <Field label="US News rank">
                    <Input
                      type="number"
                      value={draft.us_news_rank ?? ""}
                      onChange={(e) => patch({ us_news_rank: e.target.value ? Number(e.target.value) : null })}
                    />
                  </Field>
                  <Field label="CS rank">
                    <Input
                      type="number"
                      value={draft.cs_rank ?? ""}
                      onChange={(e) => patch({ cs_rank: e.target.value ? Number(e.target.value) : null })}
                    />
                  </Field>
                  <Field label="Tuition / year ($)">
                    <Input
                      type="number"
                      value={draft.tuition_per_year ?? ""}
                      onChange={(e) =>
                        patch({ tuition_per_year: e.target.value ? Number(e.target.value) : null })
                      }
                    />
                  </Field>
                  <Field label="Living cost / year ($)">
                    <Input
                      type="number"
                      value={draft.living_cost_per_year ?? ""}
                      onChange={(e) =>
                        patch({ living_cost_per_year: e.target.value ? Number(e.target.value) : null })
                      }
                    />
                  </Field>
                  <Field label="Application fee ($)">
                    <Input
                      type="number"
                      value={draft.application_fee ?? ""}
                      onChange={(e) =>
                        patch({ application_fee: e.target.value ? Number(e.target.value) : null })
                      }
                    />
                  </Field>
                </div>

                <Field label="Overview / research notes">
                  <Textarea
                    rows={4}
                    value={draft.overview ?? ""}
                    onChange={(e) => patch({ overview: e.target.value })}
                  />
                </Field>

                <RowEditor
                  label="Programs"
                  rows={draft.programs || []}
                  cols={[
                    ["name", "Program"],
                    ["deadline", "Deadline"],
                  ]}
                  onChange={(rows) => patch({ programs: rows })}
                />

                <div className="grid gap-3 sm:grid-cols-4">
                  {(["gre", "toefl", "gpa", "lors"] as const).map((k) => (
                    <Field key={k} label={k.toUpperCase()}>
                      <Input
                        value={String(draft.requirements?.[k] ?? "")}
                        onChange={(e) =>
                          patch({ requirements: { ...draft.requirements, [k]: e.target.value } })
                        }
                      />
                    </Field>
                  ))}
                </div>

                <RowEditor
                  label="Sources"
                  rows={draft.sources || []}
                  cols={[
                    ["name", "Source"],
                    ["url", "URL"],
                  ]}
                  onChange={(rows) => patch({ sources: rows })}
                />

                <div className="flex items-center gap-3">
                  <Button onClick={save} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save research
                  </Button>
                  {savedMsg && <span className="text-sm text-emerald-700">{savedMsg}</span>}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function RowEditor({
  label,
  rows,
  cols,
  onChange,
}: {
  label: string;
  rows: Array<Record<string, unknown>>;
  cols: Array<[string, string]>;
  onChange: (rows: Array<Record<string, unknown>>) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button type="button" size="sm" variant="outline" onClick={() => onChange([...rows, {}])}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      {rows.length === 0 && <p className="text-xs text-muted-foreground">None yet.</p>}
      {rows.map((row, i) => (
        <div key={i} className="flex gap-2">
          {cols.map(([key, placeholder]) => (
            <Input
              key={key}
              placeholder={placeholder}
              value={String(row[key] ?? "")}
              onChange={(e) => {
                const next = rows.slice();
                next[i] = { ...next[i], [key]: e.target.value };
                onChange(next);
              }}
            />
          ))}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onChange(rows.filter((_, j) => j !== i))}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
}
