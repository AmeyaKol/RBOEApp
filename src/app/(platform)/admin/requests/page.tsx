"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, PageShell } from "@/components/shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminResponseModal } from "@/components/features/AdminResponseModal";
import { CommentThread } from "@/components/features/CommentThread";
import { useAuth } from "@/hooks/useAuth";
import {
  MessageSquare,
  AlertCircle,
  Clock,
  CheckCircle,
  User,
  Calendar,
  Reply,
  Loader2,
  FileText,
  GraduationCap,
  X
} from "lucide-react";
import {
  mapApiAdminRequestToViewModel,
  URGENCY_META,
  URGENCY_RANK,
  CATEGORY_LABEL,
  type AdminRequestViewModel,
  type ApiAdminRequestRow,
  type RequestCategory,
} from "@/lib/view-models/request";

const CATEGORY_FILTERS: Array<RequestCategory | "ALL"> = [
  "ALL",
  "CHAT",
  "DOCUMENT_EDIT",
  "COLLEGE_LIST",
  "VISA_MOCK",
  "OTHER",
];

const byUrgencyThenDate = (a: AdminRequestViewModel, b: AdminRequestViewModel) =>
  URGENCY_RANK[b.urgency] - URGENCY_RANK[a.urgency] ||
  new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

/**
 * Admin Requests Page
 * 
 * Features:
 * - View all incoming student requests
 * - Prioritize urgent requests
 * - Update request status
 * - Provide responses to students
 * 
 * SRS Requirements: 3.6.3, 3.6.4
 * User Stories: 2.1
 */
export default function AdminRequestsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<AdminRequestViewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<AdminRequestViewModel | null>(null);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [linkedViewRequest, setLinkedViewRequest] = useState<AdminRequestViewModel | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<RequestCategory | "ALL">("ALL");

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/requests');

      if (response.ok) {
        const data = (await response.json()) as ApiAdminRequestRow[];
        setRequests(data.map(mapApiAdminRequestToViewModel));
      } else {
        throw new Error('Failed to fetch requests');
      }
    } catch (err: unknown) {
      console.error('Error fetching requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const handleRequestUpdated = (updatedRequest?: {
    id: string;
    status: string;
    admin_response?: string;
    updated_at: string;
    responded_at?: string;
  }) => {
    if (updatedRequest) {
      setRequests((prev) =>
        prev.map((req) =>
          req.id === updatedRequest.id
            ? {
                ...req,
                status: updatedRequest.status as AdminRequestViewModel["status"],
                adminResponse: updatedRequest.admin_response || req.adminResponse,
                updatedAt: updatedRequest.updated_at,
                respondedAt: updatedRequest.responded_at || req.respondedAt,
              }
            : req
        )
      );
      return;
    }
    fetchRequests();
  };

  const handleViewProfile = (studentName: string) => {
    router.push(`/admin/students?search=${encodeURIComponent(studentName)}`);
  };

  const handleRespondClick = (request: AdminRequestViewModel) => {
    setSelectedRequest(request);
    setIsResponseModalOpen(true);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'CLOSED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Clock className="h-4 w-4" />;
      case 'IN_PROGRESS':
        return <MessageSquare className="h-4 w-4" />;
      case 'CLOSED':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Category filter, then split by urgency band + status, sorted by urgency.
  const visible = useMemo(
    () =>
      categoryFilter === "ALL"
        ? requests
        : requests.filter((req) => req.category === categoryFilter),
    [requests, categoryFilter]
  );
  const urgentRequests = useMemo(
    () =>
      visible
        .filter((req) => ["HIGH", "CRITICAL"].includes(req.urgency) && req.status !== "CLOSED")
        .sort(byUrgencyThenDate),
    [visible]
  );
  const regularRequests = useMemo(
    () =>
      visible
        .filter((req) => ["LOW", "NORMAL"].includes(req.urgency) && req.status !== "CLOSED")
        .sort(byUrgencyThenDate),
    [visible]
  );
  const completedRequests = useMemo(
    () => visible.filter((req) => req.status === "CLOSED"),
    [visible]
  );

  // Calculate statistics
  const stats = {
    total: requests.length,
    urgent: urgentRequests.length,
    inProgress: requests.filter(req => req.status === 'IN_PROGRESS').length,
    completed: completedRequests.length
  };

  const renderUrgencyBadge = (request: AdminRequestViewModel) => (
    <Badge className={`text-xs ${URGENCY_META[request.urgency].badgeClass}`}>
      {URGENCY_META[request.urgency].label}
    </Badge>
  );

  const renderCategoryBadge = (request: AdminRequestViewModel) => (
    <Badge variant="outline" className="text-xs">
      {CATEGORY_LABEL[request.category]}
    </Badge>
  );

  const renderLinkBadge = (request: AdminRequestViewModel) => {
    if (request.link.kind === "document") {
      return (
        <Badge className="bg-indigo-100 text-indigo-800 text-xs">
          <FileText className="h-3 w-3 mr-1" />
          {request.documentType}
        </Badge>
      );
    }
    if (request.link.kind === "application") {
      return (
        <Badge className="bg-emerald-100 text-emerald-800 text-xs">
          <GraduationCap className="h-3 w-3 mr-1" />
          {request.universityName}
        </Badge>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading requests...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Request management"
        description="Manage and respond to student requests efficiently"
      />
      {error && (
        <div className="-mt-2 mb-6 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Topic:</span>
        {CATEGORY_FILTERS.map((c) => (
          <button
            key={c}
            onClick={() => setCategoryFilter(c)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              categoryFilter === c
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {c === "ALL" ? "All" : CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>

      <Tabs defaultValue="urgent" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="urgent">
            Urgent Requests
            {urgentRequests.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {urgentRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="regular">
            Regular Requests
            {regularRequests.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {regularRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        {/* Urgent Requests Tab */}
        <TabsContent value="urgent">
          <div className="space-y-4">
            {urgentRequests.length > 0 ? (
              urgentRequests.map((request) => (
                <Card key={request.id} className="border-red-200 bg-red-50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          {renderUrgencyBadge(request)}
                          {renderCategoryBadge(request)}
                          {renderLinkBadge(request)}
                        </div>
                        <CardTitle className="text-lg">{request.title}</CardTitle>
                        <CardDescription>
                          From: {request.studentName} • Submitted {new Date(request.createdAt).toLocaleDateString()}
                          {request.urgentReason && ` • ${request.urgentReason}`}
                        </CardDescription>
                        {request.link.label && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {request.link.kind === "document" ? "Document" : "University"}: {request.link.label}
                          </p>
                        )}
                      </div>
                      <Badge className={getStatusBadgeColor(request.status)}>
                        {request.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm">{request.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>Student: {request.studentName}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{URGENCY_META[request.urgency].sla}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={() => handleRespondClick(request)}>
                        <Reply className="h-4 w-4 mr-1" />
                        Respond
                      </Button>
                      {request.link.kind === "document" && (
                        <Button size="sm" variant="outline" onClick={() => setLinkedViewRequest(request)}>
                          <FileText className="h-4 w-4 mr-1" />
                          View Document
                        </Button>
                      )}
                      {request.link.kind === "application" && (
                        <Button size="sm" variant="outline" onClick={() => setLinkedViewRequest(request)}>
                          <GraduationCap className="h-4 w-4 mr-1" />
                          View Application
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleViewProfile(request.studentName)}>
                        <User className="h-4 w-4 mr-1" />
                        View Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">No urgent requests</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Regular Requests Tab */}
        <TabsContent value="regular">
          <div className="space-y-4">
            {regularRequests.length > 0 ? (
              regularRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          {renderUrgencyBadge(request)}
                          {renderCategoryBadge(request)}
                          {renderLinkBadge(request)}
                        </div>
                        <CardTitle className="text-lg">{request.title}</CardTitle>
                        <CardDescription>
                          From: {request.studentName} • Submitted {new Date(request.createdAt).toLocaleDateString()}
                        </CardDescription>
                        {request.link.label && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {request.link.kind === "document" ? "Document" : "University"}: {request.link.label}
                          </p>
                        )}
                      </div>
                      <Badge className={getStatusBadgeColor(request.status)}>
                        {request.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm">{request.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>Student: {request.studentName}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Response time: 24-48 hours</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={() => handleRespondClick(request)}>
                        <Reply className="h-4 w-4 mr-1" />
                        Respond
                      </Button>
                      {request.link.kind === "document" && (
                        <Button size="sm" variant="outline" onClick={() => setLinkedViewRequest(request)}>
                          <FileText className="h-4 w-4 mr-1" />
                          View Document
                        </Button>
                      )}
                      {request.link.kind === "application" && (
                        <Button size="sm" variant="outline" onClick={() => setLinkedViewRequest(request)}>
                          <GraduationCap className="h-4 w-4 mr-1" />
                          View Application
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleViewProfile(request.studentName)}>
                        <User className="h-4 w-4 mr-1" />
                        View Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">No regular requests</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Completed Requests Tab */}
        <TabsContent value="completed">
          <div className="space-y-4">
            {completedRequests.length > 0 ? (
              completedRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <Badge className="bg-green-100 text-green-800">Completed</Badge>
                          {renderCategoryBadge(request)}
                          {renderLinkBadge(request)}
                        </div>
                        <CardTitle className="text-lg">{request.title}</CardTitle>
                        <CardDescription>
                          From: {request.studentName} • Completed {new Date(request.respondedAt || request.updatedAt).toLocaleDateString()}
                        </CardDescription>
                        {request.link.label && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {request.link.kind === "document" ? "Document" : "University"}: {request.link.label}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm">{request.description}</p>
                    {request.adminResponse && (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-green-800">Your Response:</p>
                        <p className="text-sm text-green-700 mt-1">{request.adminResponse}</p>
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
              <CardDescription>
                Overview of request management performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">Total Requests</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
                  <div className="text-sm text-muted-foreground">Urgent</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
                  <div className="text-sm text-muted-foreground">In Progress</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Linked item viewer (document or application) + comment thread */}
      {linkedViewRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[85vh] flex flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {renderLinkBadge(linkedViewRequest)}
                    <span className="text-sm text-muted-foreground">
                      From: {linkedViewRequest.studentName}
                    </span>
                  </div>
                  <CardTitle>
                    {linkedViewRequest.link.kind === "document"
                      ? linkedViewRequest.documentTitle
                      : linkedViewRequest.universityName}
                  </CardTitle>
                  {linkedViewRequest.link.kind === "application" && (
                    <CardDescription>
                      {linkedViewRequest.programName || "Program not set"}
                      {linkedViewRequest.applicationStatus
                        ? ` • ${linkedViewRequest.applicationStatus}`
                        : ""}
                      {linkedViewRequest.applicationDeadline
                        ? ` • Due ${new Date(linkedViewRequest.applicationDeadline).toLocaleDateString()}`
                        : ""}
                    </CardDescription>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLinkedViewRequest(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-y-auto flex-1 space-y-4">
              {linkedViewRequest.link.kind === "document" &&
                (linkedViewRequest.documentContent ? (
                  <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">
                    {linkedViewRequest.documentContent}
                  </pre>
                ) : (
                  <p className="text-muted-foreground text-sm">No content available.</p>
                ))}
              <div className="border-t pt-4">
                <CommentThread
                  documentId={
                    linkedViewRequest.link.kind === "document" ? linkedViewRequest.link.id : undefined
                  }
                  applicationId={
                    linkedViewRequest.link.kind === "application"
                      ? linkedViewRequest.link.id
                      : undefined
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Admin Response Modal */}
      <AdminResponseModal
        isOpen={isResponseModalOpen}
        onClose={() => setIsResponseModalOpen(false)}
        onRequestUpdated={handleRequestUpdated}
        request={
          selectedRequest
            ? {
                id: selectedRequest.id,
                title: selectedRequest.title,
                description: selectedRequest.description,
                status: selectedRequest.status,
                is_urgent: selectedRequest.isUrgent,
                urgent_reason: selectedRequest.urgentReason,
                admin_response: selectedRequest.adminResponse,
                created_at: selectedRequest.createdAt,
                updated_at: selectedRequest.updatedAt,
                responded_at: selectedRequest.respondedAt,
                profiles: {
                  full_name: selectedRequest.studentName,
                  gre_score: selectedRequest.greScore,
                  toefl_score: selectedRequest.toeflScore,
                },
              }
            : null
        }
      />
    </PageShell>
  );
} 