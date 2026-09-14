"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader, PageShell } from "@/components/shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AddApplicationModal } from "@/components/features/AddApplicationModal";
import { CommentThread } from "@/components/features/CommentThread";
import { useAuth } from "@/hooks/useAuth";
import {
  mapApiApplicationToViewModel,
  type ApiStudentApplicationRow,
  type ApplicationViewModel,
} from "@/lib/view-models/application";
import { 
  University,
  Calendar,
  DollarSign,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Loader2,
  X
} from "lucide-react";

/**
 * Student Applications Page
 * 
 * Features:
 * - University application tracking
 * - Application status management
 * - Deadline tracking
 * - Cost tracking
 * 
 * SRS Requirements: 3.5.1, 3.5.2, 3.5.3
 * User Stories: 1.3
 */
export default function StudentApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<ApplicationViewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewApp, setViewApp] = useState<ApplicationViewModel | null>(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/student/applications');
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }
      const data = (await response.json()) as ApiStudentApplicationRow[];
      setApplications(data.map(mapApiApplicationToViewModel));
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  const filteredApplications = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) {
      return applications;
    }
    return applications.filter((app) =>
      app.universityName.toLowerCase().includes(normalizedSearch) ||
      app.programName?.toLowerCase().includes(normalizedSearch)
    );
  }, [applications, searchTerm]);

  const handleApplicationAdded = () => {
    fetchApplications(); // Refresh the list
  };

  const handleDeleteApplication = async (applicationId: string) => {
    if (!confirm('Are you sure you want to delete this application?')) {
      return;
    }

    try {
      const response = await fetch(`/api/student/applications/${applicationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from local state
        setApplications(prev => prev.filter(app => app.id !== applicationId));
      } else {
        throw new Error('Failed to delete application');
      }
    } catch (err) {
      console.error('Error deleting application:', err);
      alert('Failed to delete application. Please try again.');
    }
  };

  const getStatusColor = (status: ApplicationViewModel["status"]) => {
    switch (status) {
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800';
      case 'APPLIED':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'WAITLISTED':
        return 'bg-muted text-foreground';
      case 'APPLYING':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate statistics
  const stats = {
    total: applications.length,
    accepted: applications.filter(app => app.status === 'ACCEPTED').length,
    rejected: applications.filter(app => app.status === 'REJECTED').length,
    inProgress: applications.filter(app => ['RESEARCHING', 'APPLYING', 'APPLIED'].includes(app.status)).length
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading your applications...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Application tracker"
        description="Track your university applications, deadlines, and application status"
        actions={
          <a
            href="/student/university-research"
            className="text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            Browse university research →
          </a>
        }
      />
      {error && (
        <div className="-mt-2 mb-6 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search universities..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Application
          </Button>
        </div>
      </div>

      {/* Applications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredApplications.map((application) => (
          <Card key={application.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{application.universityName}</CardTitle>
                  <CardDescription>{application.programName || 'Program not specified'}</CardDescription>
                </div>
                <Badge className={getStatusColor(application.status)}>
                  {application.status.charAt(0) + application.status.slice(1).toLowerCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {application.deadline && (
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Deadline: {new Date(application.deadline).toLocaleDateString()}</span>
                </div>
              )}
              {application.applicationFee && (
                <div className="flex items-center space-x-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>Application Fee: ${application.applicationFee}</span>
                </div>
              )}
              <div className="flex items-center space-x-2 text-sm">
                <University className="h-4 w-4 text-muted-foreground" />
                <span>Added: {new Date(application.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex space-x-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => setViewApp(application)}>
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button size="sm" variant="outline">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleDeleteApplication(application.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add New Application Card */}
        {filteredApplications.length === 0 && !searchTerm ? (
          <Card className="border-dashed">
            <CardContent className="flex items-center justify-center h-48">
              <div className="text-center">
                <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">Add Your First Application</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start tracking your university applications
                </p>
                <Button onClick={() => setIsAddModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Application
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : searchTerm && filteredApplications.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">No applications found matching &quot;{searchTerm}&quot;</p>
          </div>
        ) : null}
      </div>

      {/* Application Statistics */}
      {applications.length > 0 && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Application Statistics</CardTitle>
              <CardDescription>
                Overview of your application progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">Total Applications</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
                  <div className="text-sm text-muted-foreground">Accepted</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                  <div className="text-sm text-muted-foreground">Rejected</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
                  <div className="text-sm text-muted-foreground">In Progress</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Application Modal */}
      <AddApplicationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onApplicationAdded={handleApplicationAdded}
      />

      {/* Application detail + admin comments */}
      {viewApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-xl max-h-[85vh] flex flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{viewApp.universityName}</CardTitle>
                  <CardDescription>
                    {viewApp.programName || "Program not specified"}
                    {viewApp.deadline
                      ? ` • Due ${new Date(viewApp.deadline).toLocaleDateString()}`
                      : ""}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setViewApp(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-y-auto flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(viewApp.status)}>
                  {viewApp.status.charAt(0) + viewApp.status.slice(1).toLowerCase()}
                </Badge>
                {viewApp.applicationFee ? (
                  <span className="text-sm text-muted-foreground">
                    Fee: ${viewApp.applicationFee}
                  </span>
                ) : null}
              </div>
              <div className="border-t pt-4">
                <CommentThread applicationId={viewApp.id} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageShell>
  );
} 