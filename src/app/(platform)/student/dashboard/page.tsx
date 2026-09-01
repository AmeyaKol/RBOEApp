"use client";

import { useState, useEffect } from "react";
import { PageHeader, PageShell } from "@/components/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { EditProfileModal } from "@/components/features/EditProfileModal";
import { 
  FileText, 
  GraduationCap, 
  MessageSquare, 
  Plus,
  Search,
  Users,
  Loader2
} from "lucide-react";

interface Application {
  id: string;
  university_name: string;
  program_name: string;
  status: string;
  deadline: string;
  application_fee: number;
  created_at: string;
}

interface UserProfile {
  full_name: string;
  gre_score: number;
  toefl_score: number;
  undergrad_gpa: number;
  work_experience_months: number;
  onboarding_stage?: string | null;
}

/**
 * Student Dashboard Page
 * 
 * Features:
 * - Welcome section with quick actions
 * - Application status overview
 * - Recent activity feed
 * - Profile summary
 * - Documents section
 * - Upcoming deadlines
 * 
 * SRS Requirements: 3.2.2
 * User Stories: 1.1
 */
export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);

      const profileResponse = await fetch('/api/student/profile');
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfile(profileData);
      }

      const applicationsResponse = await fetch('/api/student/applications');
      if (applicationsResponse.ok) {
        const applicationsData = await applicationsResponse.json();
        setApplications(applicationsData);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdated = () => {
    fetchData(); // Refresh all data when profile is updated
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Calculate application statistics
  const applicationStats = {
    total: applications.length,
    accepted: applications.filter(app => app.status === 'ACCEPTED').length,
    inProgress: applications.filter(app => ['APPLYING', 'APPLIED'].includes(app.status)).length,
    rejected: applications.filter(app => app.status === 'REJECTED').length
  };

  // Get upcoming deadlines (applications due within 30 days)
  const upcomingDeadlines = applications
    .filter(app => {
      if (!app.deadline) return false;
      const deadline = new Date(app.deadline);
      const now = new Date();
      const daysDiff = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 3600 * 24));
      return daysDiff > 0 && daysDiff <= 30;
    })
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 3);

  if (loading) {
    return (
      <PageShell>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title={`Welcome back, ${profile?.full_name || "Student"}`}
        description={`You have ${upcomingDeadlines.length} upcoming deadlines and ${applicationStats.inProgress} applications in progress. Keep your applications on track.`}
      />
      {error && (
        <div className="-mt-2 mb-6 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {profile?.onboarding_stage &&
        !["ACTIVE", "SUBMITTED"].includes(profile.onboarding_stage) && (
          <div className="mb-6 flex flex-col gap-2 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Finish onboarding so your counselor can build your university shortlist.
            </span>
            <Link href="/student/onboarding">
              <Button size="sm">Complete your profile</Button>
            </Link>
          </div>
        )}
      {profile?.onboarding_stage === "SUBMITTED" && (
        <div className="mb-6 rounded-md border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">
          Your intake is in — your counselor is preparing your recommended college list.
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link href="/student/applications">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg border border-border bg-card p-2">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">New Application</h3>
                  <p className="text-sm text-muted-foreground">Add university</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/student/documents">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg border border-border bg-card p-2">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Create SOP</h3>
                  <p className="text-sm text-muted-foreground">Write documents</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/student/requests">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg border border-border bg-card p-2">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Request Support</h3>
                  <p className="text-sm text-muted-foreground">Get help</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/student/applications">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg border border-border bg-card p-2">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Research Programs</h3>
                  <p className="text-sm text-muted-foreground">Find universities</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Application Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GraduationCap className="h-5 w-5" />
                <span>Application Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{applicationStats.total}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{applicationStats.accepted}</div>
                  <div className="text-sm text-muted-foreground">Accepted</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{applicationStats.inProgress}</div>
                  <div className="text-sm text-muted-foreground">In Progress</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{applicationStats.rejected}</div>
                  <div className="text-sm text-muted-foreground">Rejected</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {applications.slice(0, 4).map((app) => (
                  <div key={app.id} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      app.status === 'ACCEPTED' ? 'bg-green-500' :
                      app.status === 'APPLIED' ? 'bg-blue-500' :
                      app.status === 'REJECTED' ? 'bg-red-500' :
                      'bg-yellow-500'
                    }`}></div>
                  <div className="flex-1">
                      <p className="text-sm font-medium">
                        {app.status === 'APPLIED' ? 'Application submitted to' : 
                         app.status === 'ACCEPTED' ? 'Accepted by' :
                         app.status === 'REJECTED' ? 'Rejected by' :
                         'Created application for'} {app.university_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(app.created_at).toLocaleDateString()}
                      </p>
                </div>
                  </div>
                ))}
                {applications.length === 0 && (
                  <p className="text-sm text-muted-foreground">No applications yet. Start by adding your first application!</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profile Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile ? (
                <>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">GRE Score</span>
                    <span className="text-sm font-medium">{profile.gre_score || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">TOEFL Score</span>
                    <span className="text-sm font-medium">{profile.toefl_score || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Undergrad GPA</span>
                    <span className="text-sm font-medium">{profile.undergrad_gpa || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Work Experience</span>
                    <span className="text-sm font-medium">
                      {profile.work_experience_months ? `${profile.work_experience_months} months` : 'Not set'}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading profile...</p>
              </div>
              )}
              <Button variant="outline" className="w-full mt-3" onClick={() => setIsEditProfileModalOpen(true)}>
                Edit Profile
              </Button>
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Deadlines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.map((app) => {
                  const deadline = new Date(app.deadline);
                  const now = new Date();
                  const daysDiff = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 3600 * 24));
                  
                  return (
                    <div key={app.id} className="flex items-center justify-between">
                <div>
                        <p className="text-sm font-medium">{app.university_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {deadline.toLocaleDateString()}
                        </p>
                </div>
                      <Badge variant={daysDiff <= 7 ? "destructive" : "outline"}>
                        {daysDiff} day{daysDiff !== 1 ? 's' : ''}
                      </Badge>
              </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
              )}
            </CardContent>
          </Card>

          {/* Admin Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Your Admin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Admin Support</p>
                  <p className="text-xs text-muted-foreground">Get help with your applications</p>
                </div>
              </div>
              <Link href="/student/requests">
              <Button size="sm" className="w-full">
                <MessageSquare className="h-4 w-4 mr-2" />
                Contact Admin
              </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        onProfileUpdated={handleProfileUpdated}
        currentProfile={profile}
      />
    </PageShell>
  );
}
