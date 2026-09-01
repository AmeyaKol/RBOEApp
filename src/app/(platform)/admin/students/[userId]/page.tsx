"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader, PageShell } from "@/components/shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { CommentThread } from "@/components/features/CommentThread";
import {
  ArrowLeft,
  GraduationCap,
  Briefcase,
  MessageSquare,
  FileText,
  Loader2,
  Calendar,
  X,
} from "lucide-react";

interface StudentDetail {
  id: string;
  user_id: string;
  full_name: string;
  gre_score: number | null;
  toefl_score: number | null;
  undergrad_gpa: number | null;
  work_experience_months: number | null;
  created_at: string;
  applications: {
    id: string;
    university_name: string;
    program_name: string;
    status: string;
    deadline: string | null;
  }[];
  requests: {
    id: string;
    title: string;
    status: string;
    created_at: string;
  }[];
  documents: {
    id: string;
    type: string;
    title: string;
    content: string | null;
    is_master: boolean;
    version: number;
    updated_at: string;
  }[];
}

type Viewer =
  | { kind: "document"; id: string; title: string; subtitle: string; content: string }
  | { kind: "application"; id: string; title: string; subtitle: string };

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  RESOLVED: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-100 text-gray-800",
  APPLIED: "bg-blue-100 text-blue-800",
  ACCEPTED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  WAITLISTED: "bg-orange-100 text-orange-800",
  PLANNING: "bg-gray-100 text-gray-800",
};

export default function StudentDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewer, setViewer] = useState<Viewer | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }

    const fetchStudent = async () => {
      try {
        const res = await fetch(`/api/admin/students/${userId}`);
        if (!res.ok) throw new Error("Failed to fetch student");
        const data = await res.json();
        setStudent(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load student");
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [user, authLoading, userId]);

  if (loading) {
    return (
      <PageShell>
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageShell>
    );
  }

  if (error || !student) {
    return (
      <PageShell>
        <div className="text-center py-12">
          <p className="text-destructive mb-4">{error || "Student not found"}</p>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mb-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/admin/students")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> All Students
        </Button>
      </div>

      <PageHeader
        title={student.full_name}
        description={`Joined ${new Date(student.created_at).toLocaleDateString()}`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Academic Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" /> Academic Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Undergrad GPA</span>
              <span className="font-medium">{student.undergrad_gpa ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">GRE Score</span>
              <span className="font-medium">{student.gre_score ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">TOEFL Score</span>
              <span className="font-medium">{student.toefl_score ?? "—"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Work Experience */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" /> Experience
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Work Experience</span>
              <span className="font-medium">
                {student.work_experience_months != null
                  ? `${student.work_experience_months} months`
                  : "—"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Applications */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> Applications
            </CardTitle>
            <CardDescription>{student.applications.length} total</CardDescription>
          </CardHeader>
          <CardContent>
            {student.applications.length === 0 ? (
              <p className="text-muted-foreground text-sm">No applications yet</p>
            ) : (
              <div className="space-y-2">
                {student.applications.map((app) => (
                  <button
                    key={app.id}
                    onClick={() =>
                      setViewer({
                        kind: "application",
                        id: app.id,
                        title: app.university_name,
                        subtitle: app.program_name || "Program not set",
                      })
                    }
                    className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    <div>
                      <span className="font-medium">{app.university_name}</span>
                      {app.program_name && (
                        <span className="text-muted-foreground"> — {app.program_name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {app.deadline && (
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(app.deadline).toLocaleDateString()}
                        </span>
                      )}
                      <Badge className={STATUS_COLORS[app.status] ?? "bg-gray-100 text-gray-800"}>
                        {app.status}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> Documents
            </CardTitle>
            <CardDescription>
              {student.documents.length} total — click to read and comment
            </CardDescription>
          </CardHeader>
          <CardContent>
            {student.documents.length === 0 ? (
              <p className="text-muted-foreground text-sm">No documents yet</p>
            ) : (
              <div className="space-y-2">
                {student.documents.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() =>
                      setViewer({
                        kind: "document",
                        id: doc.id,
                        title: doc.title,
                        subtitle: `${doc.type}${doc.is_master ? " • master" : ""}`,
                        content: doc.content || "",
                      })
                    }
                    className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    <div>
                      <span className="font-medium">{doc.title}</span>
                      <span className="text-muted-foreground"> — {doc.type}</span>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      Updated {new Date(doc.updated_at).toLocaleDateString()}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Requests */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" /> Requests
            </CardTitle>
            <CardDescription>{student.requests.length} total</CardDescription>
          </CardHeader>
          <CardContent>
            {student.requests.length === 0 ? (
              <p className="text-muted-foreground text-sm">No requests yet</p>
            ) : (
              <div className="space-y-2">
                {student.requests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                    <span className="font-medium">{req.title}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {new Date(req.created_at).toLocaleDateString()}
                      </span>
                      <Badge className={STATUS_COLORS[req.status] ?? "bg-gray-100 text-gray-800"}>
                        {req.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Read-only viewer + comment thread */}
      {viewer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[85vh] flex flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{viewer.title}</CardTitle>
                  <CardDescription>{viewer.subtitle}</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setViewer(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-y-auto flex-1 space-y-4">
              {viewer.kind === "document" &&
                (viewer.content ? (
                  <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">
                    {viewer.content}
                  </pre>
                ) : (
                  <p className="text-muted-foreground text-sm">No content.</p>
                ))}
              <div className="border-t pt-4">
                <CommentThread
                  documentId={viewer.kind === "document" ? viewer.id : undefined}
                  applicationId={viewer.kind === "application" ? viewer.id : undefined}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageShell>
  );
}
