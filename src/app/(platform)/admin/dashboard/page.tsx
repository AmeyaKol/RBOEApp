"use client";

import { useState, useEffect } from "react";
import { PageHeader, PageShell } from "@/components/shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { 
  Users,
  MessageSquare,
  Clock,
  AlertCircle,
  Eye,
  FileText,
  GraduationCap,
  Loader2
} from "lucide-react";

interface DashboardData {
  stats: {
    totalStudents: number;
    totalApplications: number;
    pendingRequests: number;
    successRate: string;
  };
  applicationStats: {
    total: number;
    accepted: number;
    inProgress: number;
    rejected: number;
  };
  recentRequests: Array<{
    id: string;
    title: string;
    is_urgent: boolean;
    status: string;
    created_at: string;
    student_name?: string;
    profiles?: {
      full_name: string;
    };
  }>;
  upcomingDeadlines: Array<{
    deadline: string;
    university_name: string;
    program_name?: string;
    status?: string;
    profiles?: {
      full_name: string;
    };
  }>;
  recentActivity: Array<{
    kind: "request" | "document" | "application";
    text: string;
    detail: string;
    at: string;
  }>;
}

/**
 * Admin Dashboard Page
 * 
 * Features:
 * - Major action cards (Manage Students, View Requests)
 * - Recent support requests
 * - Application status for assigned students only
 * - Calendar-style upcoming deadlines
 * - Recent student activity tracking
 * - Student onboarding system
 * - University research portal
 * 
 * SRS Requirements: 3.2.1
 * User Stories: 2.1, 2.2
 */
export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/dashboard');

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        throw new Error('Failed to fetch dashboard data');
      }
    } catch (err: unknown) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (loading) {
    return (
      <PageShell>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Admin Dashboard"
        description="Manage your student portfolio and track application progress"
      />
      {error && (
        <div className="-mt-2 mb-6 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Major Action Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="cursor-pointer border-border transition-colors hover:border-primary/40">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3 text-foreground">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <div className="text-xl">Manage Students</div>
                <div className="text-sm font-normal text-muted-foreground">
                  {dashboardData?.stats.totalStudents || 0} students assigned to you
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              View and manage all students assigned to you, track their progress, and update their application status.
            </p>
            <Link href="/admin/students">
              <Button className="w-full">
                <Users className="mr-2 h-4 w-4" />
                Open Student Management
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="cursor-pointer border-border transition-colors hover:border-primary/40">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3 text-foreground">
              <MessageSquare className="h-8 w-8 text-primary" />
              <div>
                <div className="text-xl">View Requests</div>
                <div className="text-sm font-normal text-muted-foreground">
                  {dashboardData?.stats.pendingRequests || 0} requests pending
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              Review and respond to student requests, prioritize urgent items, and track resolution progress.
            </p>
            <Link href="/admin/requests">
              <Button className="w-full" variant="secondary">
                <MessageSquare className="mr-2 h-4 w-4" />
                Open Request Center
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Support Requests */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Support Requests</CardTitle>
                <Link href="/admin/requests">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData?.recentRequests.length ? (
                  dashboardData.recentRequests.map((request) => (
                    <div 
                      key={request.id} 
                      className={`flex items-center justify-between p-4 border rounded-lg ${
                        request.is_urgent ? 'border-red-200 bg-red-50' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {request.is_urgent ? (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        ) : (
                          <MessageSquare className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <p className="font-medium">{request.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {request.profiles?.full_name || request.student_name || 'Student'} • {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {request.is_urgent && <Badge variant="destructive">Urgent</Badge>}
                        <Link href="/admin/requests">
                          <Button size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">No recent requests</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Application Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Application Status Overview</CardTitle>
              <CardDescription>Across all students in your workspace</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg bg-blue-50">
                  <div className="text-2xl font-bold text-blue-600">{dashboardData?.applicationStats.total || 0}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
                <div className="text-center p-4 border rounded-lg bg-green-50">
                  <div className="text-2xl font-bold text-green-600">{dashboardData?.applicationStats.accepted || 0}</div>
                  <div className="text-sm text-muted-foreground">Accepted</div>
                </div>
                <div className="text-center p-4 border rounded-lg bg-yellow-50">
                  <div className="text-2xl font-bold text-yellow-600">{dashboardData?.applicationStats.inProgress || 0}</div>
                  <div className="text-sm text-muted-foreground">In Progress</div>
                </div>
                <div className="text-center p-4 border rounded-lg bg-gray-50">
                  <div className="text-2xl font-bold text-gray-600">{dashboardData?.applicationStats.rejected || 0}</div>
                  <div className="text-sm text-muted-foreground">Rejected</div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-lg bg-muted p-3 text-sm">
                <span className="text-muted-foreground">
                  {dashboardData?.stats.totalStudents || 0} students •{" "}
                  {dashboardData?.stats.totalApplications || 0} applications
                </span>
                <span className="font-medium text-foreground">
                  Success rate: {dashboardData?.stats.successRate || "—"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/admin/onboarding">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  Student onboarding
                </Button>
              </Link>
              <Link href="/admin/university-research">
                <Button variant="outline" className="w-full justify-start">
                  <GraduationCap className="mr-2 h-4 w-4" />
                  University research
                </Button>
              </Link>
              <Link href="/admin/alumni-outreach">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  Alumni outreach
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* College Deadlines Calendar */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>College Deadlines</CardTitle>
                <Link href="/admin/calendar">
                  <Button variant="outline" size="sm">
                    Full Calendar
                  </Button>
                </Link>
              </div>
              <CardDescription>Next application deadlines across your students</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData?.upcomingDeadlines.length ? (
                <div className="space-y-2">
                  {dashboardData.upcomingDeadlines.map((d, i) => {
                    const days = Math.ceil(
                      (new Date(d.deadline).getTime() - Date.now()) / (1000 * 3600 * 24)
                    );
                    const urgent = days <= 3;
                    const soon = days <= 14;
                    return (
                      <div
                        key={i}
                        className={`flex items-center justify-between rounded border p-2 ${
                          urgent
                            ? "border-red-200 bg-red-50"
                            : soon
                            ? "border-yellow-200 bg-yellow-50"
                            : "border-border"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {new Date(d.deadline).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}{" "}
                            — {d.university_name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {d.profiles?.full_name || "Student"}
                            {d.program_name ? ` • ${d.program_name}` : ""}
                          </p>
                        </div>
                        <Badge variant={urgent ? "destructive" : "outline"}>
                          {days <= 0 ? "Due" : days === 1 ? "Tomorrow" : `${days} days`}
                        </Badge>
                      </div>
                    );
                  })}
                  <div className="mt-3 text-xs text-muted-foreground">
                    🔴 Urgent (≤3 days) • 🟡 Upcoming (≤14 days)
                  </div>
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No upcoming deadlines
                </p>
              )}
            </CardContent>
          </Card>

          {/* Student Activity Tracking */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Student Activity</CardTitle>
              <CardDescription>Latest requests, document edits, and application changes</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData?.recentActivity.length ? (
                <div className="space-y-3">
                  {dashboardData.recentActivity.map((a, i) => {
                    const Icon =
                      a.kind === "request"
                        ? MessageSquare
                        : a.kind === "document"
                        ? FileText
                        : GraduationCap;
                    return (
                      <div key={i} className="flex items-start space-x-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{a.text}</p>
                          <p className="text-xs text-muted-foreground">
                            {a.detail} • {new Date(a.at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">No recent activity</p>
              )}

              <div className="mt-4 pt-3 border-t">
                <Link href="/admin/activity-log">
                  <Button variant="outline" size="sm" className="w-full">
                    <Clock className="w-4 h-4 mr-2" />
                    View Full Activity Log
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
