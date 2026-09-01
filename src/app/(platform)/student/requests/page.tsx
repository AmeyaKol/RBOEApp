"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader, PageShell } from "@/components/shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CommentThread } from "@/components/features/CommentThread";
import { useAuth } from "@/hooks/useAuth";
import {
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  Loader2,
  FileText,
  GraduationCap,
} from "lucide-react";
import {
  mapApiStudentRequestToViewModel,
  type ApiStudentRequestRow,
  type StudentRequestViewModel,
} from "@/lib/view-models/request";

type Regarding = "general" | "document" | "application";

interface DocOption {
  id: string;
  title: string;
  type: string;
  is_master: boolean;
}

interface AppOption {
  id: string;
  university_name: string;
  program_name: string | null;
}

/**
 * Student Requests Page
 *
 * Submit requests to an admin, optionally linked to a document or a university
 * application. The admin reviews the linked item and leaves comments on it.
 */
export default function StudentRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<StudentRequestViewModel[]>([]);
  const [documents, setDocuments] = useState<DocOption[]>([]);
  const [applications, setApplications] = useState<AppOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    regarding: "general" as Regarding,
    linkedId: "",
    priority: "normal",
    title: "",
    description: "",
    urgentReason: "",
  });

  const resetForm = () =>
    setFormData({
      regarding: "general",
      linkedId: "",
      priority: "normal",
      title: "",
      description: "",
      urgentReason: "",
    });

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/student/requests");
      if (response.ok) {
        const data = (await response.json()) as ApiStudentRequestRow[];
        setRequests(data.map(mapApiStudentRequestToViewModel));
      } else {
        throw new Error("Failed to fetch requests");
      }
    } catch (err: unknown) {
      console.error("Error fetching requests:", err);
      setError(err instanceof Error ? err.message : "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const fetchLinkables = async () => {
    try {
      const [docRes, appRes] = await Promise.all([
        fetch("/api/student/documents"),
        fetch("/api/student/applications"),
      ]);
      if (docRes.ok) {
        const docs = (await docRes.json()) as DocOption[];
        setDocuments(docs);
      }
      if (appRes.ok) {
        const apps = (await appRes.json()) as AppOption[];
        setApplications(apps);
      }
    } catch (err) {
      console.error("Error loading linkable items:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRequests();
      fetchLinkables();
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      // Changing the "regarding" category clears any previously picked item.
      if (field === "regarding") next.linkedId = "";
      return next;
    });
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const linkRequired = formData.regarding !== "general";
  const canSubmit =
    !!formData.title &&
    !!formData.description &&
    (!linkRequired || !!formData.linkedId) &&
    (formData.priority !== "urgent" || !!formData.urgentReason) &&
    !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const body: Record<string, unknown> = {
        title: formData.title,
        description: formData.description,
        is_urgent: formData.priority === "urgent",
        urgent_reason: formData.priority === "urgent" ? formData.urgentReason : null,
      };
      if (formData.regarding === "document" && formData.linkedId) {
        body.document_id = formData.linkedId;
      } else if (formData.regarding === "application" && formData.linkedId) {
        body.application_id = formData.linkedId;
      }

      const response = await fetch("/api/student/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error("Failed to submit request");

      resetForm();
      fetchRequests();
      setSuccess("Request submitted. Your admin will follow up here.");
    } catch (err) {
      console.error("Error submitting request:", err);
      setError("An error occurred while submitting the request");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800";
      case "CLOSED":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "OPEN":
        return <Clock className="h-4 w-4" />;
      case "IN_PROGRESS":
        return <MessageSquare className="h-4 w-4" />;
      case "CLOSED":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const renderLinkBadge = (request: StudentRequestViewModel) => {
    if (request.link.kind === "document") {
      return (
        <Badge className="bg-indigo-100 text-indigo-800 text-xs">
          <FileText className="h-3 w-3 mr-1" />
          {request.link.documentType ? `${request.link.documentType}: ` : ""}
          {request.link.label}
        </Badge>
      );
    }
    if (request.link.kind === "application") {
      return (
        <Badge className="bg-emerald-100 text-emerald-800 text-xs">
          <GraduationCap className="h-3 w-3 mr-1" />
          {request.link.label}
        </Badge>
      );
    }
    return null;
  };

  const activeRequests = useMemo(
    () => requests.filter((req) => req.status === "OPEN" || req.status === "IN_PROGRESS"),
    [requests]
  );
  const closedRequests = useMemo(
    () => requests.filter((req) => req.status === "CLOSED"),
    [requests]
  );

  const stats = {
    total: requests.length,
    completed: closedRequests.length,
    inProgress: requests.filter((req) => req.status === "IN_PROGRESS").length,
    urgent: requests.filter((req) => req.isUrgent && req.status !== "CLOSED").length,
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading your requests...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Request center"
        description="Submit requests to your admin for document reviews, university feedback, and support"
      />
      {error && (
        <div className="-mt-2 mb-6 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="-mt-2 mb-6 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">
          {success}
        </div>
      )}

      <Tabs defaultValue="new" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="new">New Request</TabsTrigger>
          <TabsTrigger value="active">
            Active Requests
            {activeRequests.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">Request History</TabsTrigger>
        </TabsList>

        {/* New Request Tab */}
        <TabsContent value="new">
          <Card>
            <CardHeader>
              <CardTitle>Submit New Request</CardTitle>
              <CardDescription>
                Optionally link a document or a university so your admin can comment on it directly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="regarding">Regarding</Label>
                    <select
                      id="regarding"
                      className="w-full p-2 border rounded-md"
                      value={formData.regarding}
                      onChange={(e) => handleInputChange("regarding", e.target.value)}
                      disabled={submitting}
                    >
                      <option value="general">General question / meeting</option>
                      <option value="document">Document review (SOP / LOR)</option>
                      <option value="application">University application</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <select
                      id="priority"
                      className="w-full p-2 border rounded-md"
                      value={formData.priority}
                      onChange={(e) => handleInputChange("priority", e.target.value)}
                      disabled={submitting}
                    >
                      <option value="normal">Normal</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                {formData.regarding === "document" && (
                  <div className="space-y-2 mb-4">
                    <Label htmlFor="linkedDoc">Document *</Label>
                    <select
                      id="linkedDoc"
                      className="w-full p-2 border rounded-md"
                      value={formData.linkedId}
                      onChange={(e) => handleInputChange("linkedId", e.target.value)}
                      disabled={submitting}
                      required
                    >
                      <option value="">Select a document</option>
                      {documents.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.title} ({doc.type}
                          {doc.is_master ? ", master" : ""})
                        </option>
                      ))}
                    </select>
                    {documents.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        No documents yet — create one under Documents first.
                      </p>
                    )}
                  </div>
                )}

                {formData.regarding === "application" && (
                  <div className="space-y-2 mb-4">
                    <Label htmlFor="linkedApp">University application *</Label>
                    <select
                      id="linkedApp"
                      className="w-full p-2 border rounded-md"
                      value={formData.linkedId}
                      onChange={(e) => handleInputChange("linkedId", e.target.value)}
                      disabled={submitting}
                      required
                    >
                      <option value="">Select a university</option>
                      {applications.map((app) => (
                        <option key={app.id} value={app.id}>
                          {app.university_name}
                          {app.program_name ? ` — ${app.program_name}` : ""}
                        </option>
                      ))}
                    </select>
                    {applications.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        No applications yet — add one under Applications first.
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2 mb-4">
                  <Label htmlFor="title">Request Title *</Label>
                  <Input
                    id="title"
                    placeholder="Brief title for your request"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="space-y-2 mb-4">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide detailed information about your request..."
                    rows={6}
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>

                {formData.priority === "urgent" && (
                  <div className="space-y-2 mb-4">
                    <Label htmlFor="urgentReason">Urgent Reason *</Label>
                    <Textarea
                      id="urgentReason"
                      placeholder="Explain why this request is urgent (e.g., deadline approaching)"
                      rows={3}
                      value={formData.urgentReason}
                      onChange={(e) => handleInputChange("urgentReason", e.target.value)}
                      disabled={submitting}
                      required
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={resetForm} disabled={submitting}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!canSubmit}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Request
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Requests Tab */}
        <TabsContent value="active">
          <div className="space-y-4">
            {activeRequests.length > 0 ? (
              activeRequests.map((request) => (
                <Card key={request.id} className={request.isUrgent ? "border-red-200 bg-red-50" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          {getStatusIcon(request.status)}
                          {request.isUrgent && <AlertCircle className="h-4 w-4 text-red-600" />}
                          <Badge className={getStatusBadgeColor(request.status)}>
                            {request.status.replace("_", " ")}
                          </Badge>
                          {request.isUrgent && <Badge variant="destructive">Urgent</Badge>}
                          {renderLinkBadge(request)}
                        </div>
                        <CardTitle className="text-lg">{request.title}</CardTitle>
                        <CardDescription>
                          Submitted {new Date(request.createdAt).toLocaleDateString()}
                          {request.updatedAt !== request.createdAt &&
                            ` • Updated ${new Date(request.updatedAt).toLocaleDateString()}`}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{request.description}</p>
                    {request.isUrgent && request.urgentReason && (
                      <div className="mb-4 p-3 bg-red-100 rounded-lg">
                        <p className="text-sm font-medium text-red-800">Urgent Reason:</p>
                        <p className="text-sm text-red-700">{request.urgentReason}</p>
                      </div>
                    )}
                    {request.adminResponse && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-800">Admin Response:</p>
                        <p className="text-sm text-blue-700 mt-1">{request.adminResponse}</p>
                        <p className="text-xs text-blue-600 mt-2">
                          Responded on {new Date(request.respondedAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {request.link.kind !== "general" && request.link.id && (
                      <div className="mt-4 border-t pt-4">
                        <CommentThread
                          documentId={request.link.kind === "document" ? request.link.id : undefined}
                          applicationId={
                            request.link.kind === "application" ? request.link.id : undefined
                          }
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">No active requests</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Request History Tab */}
        <TabsContent value="history">
          <div className="space-y-4">
            {closedRequests.length > 0 ? (
              closedRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <Badge className="bg-green-100 text-green-800">Completed</Badge>
                          {renderLinkBadge(request)}
                        </div>
                        <CardTitle className="text-lg">{request.title}</CardTitle>
                        <CardDescription>
                          Completed{" "}
                          {new Date(request.respondedAt || request.updatedAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{request.description}</p>
                    {request.adminResponse && (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-green-800">Admin Response:</p>
                        <p className="text-sm text-green-700 mt-1">{request.adminResponse}</p>
                      </div>
                    )}
                    {request.link.kind !== "general" && request.link.id && (
                      <div className="mt-4 border-t pt-4">
                        <CommentThread
                          documentId={request.link.kind === "document" ? request.link.id : undefined}
                          applicationId={
                            request.link.kind === "application" ? request.link.id : undefined
                          }
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">No completed requests</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Request Statistics */}
      {requests.length > 0 && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Request Statistics</CardTitle>
              <CardDescription>Overview of your request activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">Total Requests</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
                  <div className="text-sm text-muted-foreground">In Progress</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
                  <div className="text-sm text-muted-foreground">Urgent</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageShell>
  );
}
