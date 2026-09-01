"use client";

import { useState } from "react";
import { PageHeader, PageShell } from "@/components/shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  Mail, 
  GraduationCap, 
  MapPin,
  Calendar,
  Phone,
  Search,
  Plus,
  MessageSquare,
  ExternalLink,
  CheckCircle,
  Clock
} from "lucide-react";

interface Alumnus {
  id: string;
  name: string;
  graduationYear: string;
  university: string;
  program: string;
  currentRole: string;
  company: string;
  location: string;
  email: string;
  phone: string;
  linkedIn: string;
  lastContact: string;
  responseRate: string;
  status: 'active' | 'inactive' | 'pending';
  connectionsMade: number;
}

interface OutreachTask {
  id: string;
  alumniId: string;
  alumniName: string;
  university: string;
  prospectiveStudent: string;
  purpose: string;
  status: 'pending' | 'contacted' | 'connected' | 'completed';
  createdDate: string;
  lastUpdate: string;
}

/**
 * Alumni Outreach Page
 * 
 * Features:
 * - Alumni database management
 * - Connection facilitation between alumni and prospects
 * - Outreach tracking and scheduling
 * - Networking value proposition
 * - Response rate monitoring
 */
export default function AlumniOutreachPage() {
  const [selectedAlumnus, setSelectedAlumnus] = useState<Alumnus | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [alumni, setAlumni] = useState<Alumnus[]>([
    {
      id: '1',
      name: 'Rajesh Kumar',
      graduationYear: '2022',
      university: 'Stanford University',
      program: 'MS Computer Science',
      currentRole: 'Software Engineer',
      company: 'Google',
      location: 'Mountain View, CA',
      email: 'rajesh.kumar@gmail.com',
      phone: '+1 650 555 0123',
      linkedIn: 'linkedin.com/in/rajeshkumar',
      lastContact: '2024-11-15',
      responseRate: '85%',
      status: 'active',
      connectionsMade: 8
    },
    {
      id: '2',
      name: 'Priyanka Mehta',
      graduationYear: '2021',
      university: 'MIT',
      program: 'MS Data Science',
      currentRole: 'Data Scientist',
      company: 'Meta',
      location: 'Menlo Park, CA',
      email: 'priyanka.mehta@gmail.com',
      phone: '+1 650 555 0124',
      linkedIn: 'linkedin.com/in/priyankamehta',
      lastContact: '2024-12-01',
      responseRate: '92%',
      status: 'active',
      connectionsMade: 12
    },
    {
      id: '3',
      name: 'Vikram Singh',
      graduationYear: '2020',
      university: 'University of Toronto',
      program: 'MS Mechanical Engineering',
      currentRole: 'Senior Engineer',
      company: 'Tesla',
      location: 'Toronto, ON',
      email: 'vikram.singh@gmail.com',
      phone: '+1 416 555 0125',
      linkedIn: 'linkedin.com/in/vikramsingh',
      lastContact: '2024-10-20',
      responseRate: '76%',
      status: 'inactive',
      connectionsMade: 5
    }
  ]);

  const [outreachTasks] = useState<OutreachTask[]>([
    {
      id: '1',
      alumniId: '1',
      alumniName: 'Rajesh Kumar',
      university: 'Stanford University',
      prospectiveStudent: 'Arjun Patel',
      purpose: 'CS program insights and career guidance',
      status: 'connected',
      createdDate: '2024-12-10',
      lastUpdate: '2024-12-12'
    },
    {
      id: '2',
      alumniId: '2',
      alumniName: 'Priyanka Mehta',
      university: 'MIT',
      prospectiveStudent: 'Zara Khan',
      purpose: 'Data Science program information',
      status: 'contacted',
      createdDate: '2024-12-08',
      lastUpdate: '2024-12-11'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'connected': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-muted text-foreground';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAlumni = alumni.filter(alum =>
    alum.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alum.university.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alum.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageShell>
      <PageHeader
        title="Alumni outreach"
        description="Connect prospective students with RBOE alumni for networking and guidance"
      />

      {/* Value Proposition */}
      <Card className="mb-8 border-border bg-muted/40">
        <CardHeader>
          <CardTitle>Alumni networking value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h4 className="mb-2 font-semibold text-foreground">Direct alumni access</h4>
              <p className="text-sm text-muted-foreground">
                Connect students with graduates from their target universities
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h4 className="mb-2 font-semibold text-foreground">Insider insights</h4>
              <p className="text-sm text-muted-foreground">
                Get real program experiences and career guidance
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <h4 className="mb-2 font-semibold text-foreground">Success stories</h4>
              <p className="text-sm text-muted-foreground">
                Learn from successful admission and career paths
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg border border-border bg-card p-2">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{alumni.length}</p>
                <p className="text-sm text-muted-foreground">Total Alumni</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg border border-border bg-card p-2">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {alumni.filter(a => a.status === 'active').length}
                </p>
                <p className="text-sm text-muted-foreground">Active Alumni</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg border border-border bg-card p-2">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {alumni.reduce((sum, a) => sum + a.connectionsMade, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Connections Made</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg border border-border bg-card p-2">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{outreachTasks.length}</p>
                <p className="text-sm text-muted-foreground">Active Outreach</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Alumni Database */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Alumni Database</CardTitle>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Alumni
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name, university, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredAlumni.map((alum) => (
                  <div 
                    key={alum.id}
                    className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                      selectedAlumnus?.id === alum.id
                        ? "border-primary bg-accent/30"
                        : "hover:border-border"
                    }`}
                    onClick={() => setSelectedAlumnus(alum)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card font-bold text-primary">
                          {alum.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h4 className="font-medium">{alum.name}</h4>
                          <p className="text-sm text-muted-foreground">{alum.currentRole} at {alum.company}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(alum.status)}>
                          {alum.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          Response: {alum.responseRate}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                      <div>
                        <span className="font-medium">University:</span> {alum.university}
                      </div>
                      <div>
                        <span className="font-medium">Graduated:</span> {alum.graduationYear}
                      </div>
                      <div>
                        <span className="font-medium">Location:</span> {alum.location}
                      </div>
                      <div>
                        <span className="font-medium">Connections:</span> {alum.connectionsMade}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alumni Details & Actions */}
        <div className="space-y-6">
          {selectedAlumnus ? (
            <>
              {/* Alumni Profile */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <GraduationCap className="w-5 h-5" />
                    <span>Alumni Profile</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>Name</Label>
                    <p className="text-sm font-medium">{selectedAlumnus.name}</p>
                  </div>
                  <div>
                    <Label>Education</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedAlumnus.program}, {selectedAlumnus.university} ({selectedAlumnus.graduationYear})
                    </p>
                  </div>
                  <div>
                    <Label>Current Position</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedAlumnus.currentRole} at {selectedAlumnus.company}
                    </p>
                  </div>
                  <div>
                    <Label>Location</Label>
                    <p className="text-sm text-muted-foreground">{selectedAlumnus.location}</p>
                  </div>
                  <div>
                    <Label>Contact Info</Label>
                    <p className="text-sm text-muted-foreground">{selectedAlumnus.email}</p>
                    <p className="text-sm text-muted-foreground">{selectedAlumnus.phone}</p>
                  </div>
                  <div>
                    <Label>Performance</Label>
                    <div className="flex items-center space-x-4">
                      <Badge className={getStatusColor(selectedAlumnus.status)}>
                        {selectedAlumnus.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {selectedAlumnus.responseRate} response rate
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Outreach Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Request Connection
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Mail className="w-4 h-4 mr-2" />
                    Send Introduction
                  </Button>
                  <Button variant="outline" className="w-full">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View LinkedIn
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Follow-up
                  </Button>
                </CardContent>
              </Card>

              {/* Connection History */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Connections</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedAlumnus.connectionsMade > 0 ? (
                      <>
                        <div className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <p className="text-sm font-medium">Connected with Arjun Patel</p>
                            <p className="text-xs text-muted-foreground">CS program guidance</p>
                          </div>
                          <Badge variant="outline">Dec 12</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <p className="text-sm font-medium">Advised Priya Sharma</p>
                            <p className="text-xs text-muted-foreground">Career path discussion</p>
                          </div>
                          <Badge variant="outline">Dec 8</Badge>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No recent connections
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Select an alumni to view details</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Outreach Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>Active Outreach</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {outreachTasks.map((task) => (
                  <div key={task.id} className="p-3 border rounded">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">{task.alumniName}</p>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      For: {task.prospectiveStudent}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {task.purpose}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}


