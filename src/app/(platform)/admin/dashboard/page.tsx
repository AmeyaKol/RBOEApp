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
  CheckCircle,
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
    profiles?: {
      full_name: string;
    };
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

          {/* Application Status Overview - Assigned Students Only */}
          <Card>
            <CardHeader>
              <CardTitle>Application Status Overview</CardTitle>
              <CardDescription>Status of applications for students assigned to you</CardDescription>
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
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  ✓ Showing data only for students assigned to you ({dashboardData?.stats.totalStudents || 0} students)
                </p>
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
              <CardDescription>University application deadlines this month</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Mini Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-4 text-center text-xs font-medium text-muted-foreground">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>
              
              <div className="grid grid-cols-7 gap-1 mb-4">
                {/* Sample calendar dates with deadline indicators */}
                {Array.from({ length: 35 }, (_, i) => {
                  const date = i + 1;
                  const hasDeadline = [15, 20, 28].includes(date);
                  const isUrgent = [15].includes(date);
                  
                  return (
                    <div 
                      key={i} 
                      className={`
                        h-8 w-8 flex items-center justify-center text-xs rounded cursor-pointer
                        ${date <= 31 ? 'hover:bg-gray-100' : 'text-gray-300'}
                        ${hasDeadline ? (isUrgent ? 'bg-red-100 text-red-800 font-bold' : 'bg-yellow-100 text-yellow-800 font-medium') : ''}
                      `}
                    >
                      {date <= 31 ? date : ''}
                      {hasDeadline && <div className={`absolute w-2 h-2 rounded-full ${isUrgent ? 'bg-red-500' : 'bg-yellow-500'} -mt-6 ml-4`}></div>}
                    </div>
                  );
                })}
              </div>
              
              {/* Deadline Details */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-red-50 rounded border border-red-200">
                  <div>
                    <p className="text-sm font-medium text-red-800">Dec 15 - Stanford University</p>
                    <p className="text-xs text-red-600">MS Computer Science (Priority)</p>
                  </div>
                  <Badge variant="destructive">Today</Badge>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-yellow-50 rounded border border-yellow-200">
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Dec 20 - MIT</p>
                    <p className="text-xs text-yellow-600">MS Data Science</p>
                  </div>
                  <Badge variant="outline">5 days</Badge>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-yellow-50 rounded border border-yellow-200">
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Dec 28 - Georgia Tech</p>
                    <p className="text-xs text-yellow-600">MS Computer Science</p>
                  </div>
                  <Badge variant="outline">13 days</Badge>
                </div>
              </div>
              
              <div className="mt-4 text-xs text-muted-foreground">
                🔴 Urgent (≤3 days) • 🟡 Upcoming (≤14 days)
              </div>
            </CardContent>
          </Card>

          {/* Student Activity Tracking */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Student Activity</CardTitle>
              <CardDescription>Track activities of students assigned to you</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Priya Sharma submitted SOP</p>
                    <p className="text-xs text-muted-foreground">Stanford CS application • 2 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Arjun Patel updated profile</p>
                    <p className="text-xs text-muted-foreground">Added TOEFL scores • 1 day ago</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Zara Khan sent new request</p>
                    <p className="text-xs text-muted-foreground">College selection advice • 2 days ago</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-muted">
                    <GraduationCap className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Priya Sharma started MIT application</p>
                    <p className="text-xs text-muted-foreground">MS Data Science program • 3 days ago</p>
                  </div>
                </div>
              </div>
              
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
