"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PageHeader, PageShell } from "@/components/shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { 
  Users, 
  Search,
  Filter,
  Eye,
  Edit,
  MessageSquare,
  GraduationCap,
  Calendar,
  TrendingUp,
  Loader2
} from "lucide-react";

interface Student {
  id: string;
  user_id: string;
  full_name: string;
  gre_score: number;
  toefl_score: number;
  undergrad_gpa: number;
  work_experience_months: number;
  created_at: string;
  applications: {
    total: number;
    submitted: number;
    accepted: number;
    next_deadline: string;
  };
  pending_requests: number;
}

/**
 * Admin Students Page
 * 
 * Features:
 * - View all assigned students
 * - Search and filter students
 * - Access student profiles
 * - Student management tools
 * 
 * SRS Requirements: 3.2.1
 * User Stories: 2.2
 */
function AdminStudentsPageInner() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const prefillSearch = searchParams.get("search");
    if (prefillSearch) {
      setSearchTerm(prefillSearch);
    }
  }, [searchParams]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/students');

      if (response.ok) {
        const data = await response.json();
        setStudents(data);
        setFilteredStudents(data);
      } else {
        throw new Error('Failed to fetch students');
      }
    } catch (err: unknown) {
      console.error('Error fetching students:', err);
      setError(err instanceof Error ? err.message : 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      fetchStudents();
    } else {
      setLoading(false);
    }
  }, [user, authLoading]);

  // Filter students based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = students.filter(student =>
        student.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(students);
    }
  }, [searchTerm, students]);

  const getStudentStatus = (student: Student) => {
    if (student.applications.accepted > 0) {
      return { label: 'Accepted', color: 'bg-green-100 text-green-800' };
    } else if (student.applications.submitted > 0) {
      return { label: 'Active', color: 'bg-blue-100 text-blue-800' };
    } else if (student.applications.total > 0) {
      return { label: 'Applying', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { label: 'Onboarding', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const formatDeadline = (deadline: string) => {
    if (!deadline) return 'No upcoming deadlines';
    const date = new Date(deadline);
    const now = new Date();
    const daysDiff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 3600 * 24));
    
    if (daysDiff <= 0) return 'Past deadline';
    if (daysDiff === 1) return 'Tomorrow';
    if (daysDiff <= 7) return `${daysDiff} days`;
    return date.toLocaleDateString();
  };

  // Calculate statistics
  const stats = {
    total: students.length,
    active: students.filter(s => s.applications.submitted > 0).length,
    onboarding: students.filter(s => s.applications.total === 0).length,
    accepted: students.filter(s => s.applications.accepted > 0).length
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading students...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Student management"
        description="Manage your assigned students and their application progress"
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
            placeholder="Search students by name..."
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
          <Button>
            <Users className="h-4 w-4 mr-2" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Student Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.length > 0 ? (
          filteredStudents.map((student) => {
            const status = getStudentStatus(student);
            
            return (
              <Card key={student.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{student.full_name}</CardTitle>
                      <CardDescription>
                        GRE: {student.gre_score || 'Not set'}
                        {student.toefl_score && ` • TOEFL: ${student.toefl_score}`}
                      </CardDescription>
                    </div>
                    <Badge className={status.color}>{status.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span>{student.applications.total} applications ({student.applications.submitted} submitted)</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Next deadline: {formatDeadline(student.applications.next_deadline)}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span>{student.pending_requests} pending requests</span>
                  </div>
                  <div className="flex space-x-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/admin/students/${student.user_id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Profile
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/admin/requests?student_id=${student.user_id}`)}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Contact
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : searchTerm ? (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">No students found matching &quot;{searchTerm}&quot;</p>
          </div>
        ) : (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">No students assigned yet</p>
          </div>
        )}
      </div>

      {/* Student Statistics */}
      {students.length > 0 && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Student Statistics</CardTitle>
              <CardDescription>
                Overview of your student portfolio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">Total Students</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                  <div className="text-sm text-muted-foreground">Active</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{stats.onboarding}</div>
                  <div className="text-sm text-muted-foreground">Onboarding</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{stats.accepted}</div>
                  <div className="text-sm text-muted-foreground">Accepted</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageShell>
  );
}

export default function AdminStudentsPage() {
  return (
    <Suspense
      fallback={
        <PageShell>
          <div className="flex min-h-[400px] items-center justify-center">
            <p className="text-muted-foreground">Loading…</p>
          </div>
        </PageShell>
      }
    >
      <AdminStudentsPageInner />
    </Suspense>
  );
} 