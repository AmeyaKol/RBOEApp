"use client";

import { useState } from "react";
import { PageHeader, PageShell } from "@/components/shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Mail, 
  Send, 
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Plus,
  Calendar,
  Phone,
  FileText
} from "lucide-react";

interface OnboardingTask {
  id: string;
  studentName: string;
  email: string;
  phone: string;
  enrollmentDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  emailsSent: number;
  lastContact: string;
  nextFollowUp: string;
  assignedAdmin: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: 'welcome' | 'follow_up' | 'document_request' | 'reminder';
}

/**
 * Student Onboarding Page
 * 
 * Features:
 * - New student enrollment management
 * - Automated email sequences
 * - Follow-up scheduling
 * - Document collection tracking
 * - Onboarding progress monitoring
 * 
 * Replaces: Generate SOP functionality
 */
export default function StudentOnboardingPage() {
  const [selectedTask, setSelectedTask] = useState<OnboardingTask | null>(null);
  const [onboardingTasks, setOnboardingTasks] = useState<OnboardingTask[]>([
    {
      id: '1',
      studentName: 'Rahul Verma',
      email: 'rahul.verma@email.com',
      phone: '+91 98765 43210',
      enrollmentDate: '2024-12-10',
      status: 'pending',
      emailsSent: 0,
      lastContact: '',
      nextFollowUp: '2024-12-16',
      assignedAdmin: 'Admin User'
    },
    {
      id: '2',
      studentName: 'Ananya Singh',
      email: 'ananya.singh@email.com',
      phone: '+91 87654 32109',
      enrollmentDate: '2024-12-08',
      status: 'in_progress',
      emailsSent: 2,
      lastContact: '2024-12-12',
      nextFollowUp: '2024-12-19',
      assignedAdmin: 'Admin User'
    },
    {
      id: '3',
      studentName: 'Vikram Patel',
      email: 'vikram.patel@email.com',
      phone: '+91 76543 21098',
      enrollmentDate: '2024-12-05',
      status: 'completed',
      emailsSent: 4,
      lastContact: '2024-12-13',
      nextFollowUp: '2024-12-20',
      assignedAdmin: 'Admin User'
    }
  ]);

  const [emailTemplates] = useState<EmailTemplate[]>([
    {
      id: '1',
      name: 'Welcome Email',
      subject: 'Welcome to RBOE Consultancy - Let\'s Get Started!',
      content: 'Dear {studentName},\n\nWelcome to RBOE Consultancy! We\'re excited to help you achieve your dream of studying abroad...',
      type: 'welcome'
    },
    {
      id: '2',
      name: 'Document Collection',
      subject: 'Required Documents for Your Application Process',
      content: 'Hi {studentName},\n\nTo proceed with your application, we need the following documents...',
      type: 'document_request'
    },
    {
      id: '3',
      name: 'Follow-up Check',
      subject: 'How are you doing with your application preparation?',
      content: 'Hello {studentName},\n\nI hope you\'re doing well. I wanted to check in on your application progress...',
      type: 'follow_up'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'pending': return <AlertCircle className="w-4 h-4 text-gray-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="Student onboarding"
        description="Manage new student enrollments and automated introduction sequences"
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{onboardingTasks.length}</p>
                <p className="text-sm text-muted-foreground">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {onboardingTasks.filter(t => t.status === 'pending').length}
                </p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Mail className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {onboardingTasks.reduce((sum, t) => sum + t.emailsSent, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Emails Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {onboardingTasks.filter(t => t.status === 'completed').length}
                </p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Onboarding Tasks List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Onboarding Tasks</CardTitle>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Student
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {onboardingTasks.map((task) => (
                  <div 
                    key={task.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedTask?.id === task.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedTask(task)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(task.status)}
                        <div>
                          <h4 className="font-medium">{task.studentName}</h4>
                          <p className="text-sm text-muted-foreground">{task.email}</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                      <div>
                        <span className="font-medium">Enrolled:</span> {new Date(task.enrollmentDate).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Emails:</span> {task.emailsSent}
                      </div>
                      <div>
                        <span className="font-medium">Last Contact:</span> {task.lastContact || 'None'}
                      </div>
                      <div>
                        <span className="font-medium">Next Follow-up:</span> {new Date(task.nextFollowUp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Task Details & Actions */}
        <div className="space-y-6">
          {selectedTask ? (
            <>
              {/* Student Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Student Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>Name</Label>
                    <p className="text-sm font-medium">{selectedTask.studentName}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="text-sm text-muted-foreground">{selectedTask.email}</p>
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <p className="text-sm text-muted-foreground">{selectedTask.phone}</p>
                  </div>
                  <div>
                    <Label>Enrollment Date</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedTask.enrollmentDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge className={getStatusColor(selectedTask.status)}>
                      {selectedTask.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    <Mail className="w-4 h-4 mr-2" />
                    Send Welcome Email
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Phone className="w-4 h-4 mr-2" />
                    Schedule Call
                  </Button>
                  <Button variant="outline" className="w-full">
                    <FileText className="w-4 h-4 mr-2" />
                    Request Documents
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Calendar className="w-4 h-4 mr-2" />
                    Set Follow-up
                  </Button>
                </CardContent>
              </Card>

              {/* Email History */}
              <Card>
                <CardHeader>
                  <CardTitle>Email History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedTask.emailsSent > 0 ? (
                      <>
                        <div className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <p className="text-sm font-medium">Welcome Email</p>
                            <p className="text-xs text-muted-foreground">Dec 12, 2024</p>
                          </div>
                          <Badge variant="outline">Sent</Badge>
                        </div>
                        {selectedTask.emailsSent > 1 && (
                          <div className="flex items-center justify-between p-2 border rounded">
                            <div>
                              <p className="text-sm font-medium">Document Request</p>
                              <p className="text-xs text-muted-foreground">Dec 13, 2024</p>
                            </div>
                            <Badge variant="outline">Sent</Badge>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No emails sent yet
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
                  <p className="text-muted-foreground">Select a student to view details</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Email Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {emailTemplates.map((template) => (
                  <div key={template.id} className="flex items-center justify-between p-2 border rounded hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium">{template.name}</p>
                      <p className="text-xs text-muted-foreground">{template.type}</p>
                    </div>
                    <Button size="sm" variant="outline">
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-3">
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}


