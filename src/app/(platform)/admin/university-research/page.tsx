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
  Search, 
  Plus, 
  ExternalLink, 
  BookOpen, 
  DollarSign,
  Calendar,
  Star,
  Globe,
  FileText,
  Save,
  Edit,
  Trash2
} from "lucide-react";

interface University {
  id: string;
  name: string;
  location: string;
  ranking: string;
  website: string;
  researchStatus: 'pending' | 'in_progress' | 'completed';
  lastUpdated: string;
}

interface Program {
  id: string;
  name: string;
  degree: string;
  duration: string;
  fees: string;
  deadline: string;
  requirements: string[];
  description: string;
}

interface ResearchData {
  basicInfo: {
    ranking: string;
    location: string;
    established: string;
    type: string;
    website: string;
  };
  programs: Program[];
  fees: {
    tuition: string;
    livingExpenses: string;
    applicationFee: string;
    otherFees: string;
  };
  requirements: {
    gre: string;
    toefl: string;
    ielts: string;
    gpa: string;
    workExperience: string;
    other: string[];
  };
  deadlines: Array<{
    program: string;
    deadline: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  sources: Array<{
    name: string;
    url: string;
    lastChecked: string;
  }>;
}

/**
 * University Research Page
 * 
 * Features:
 * - Research task management for admins
 * - Detailed university information collection
 * - Program and fee tracking
 * - Deadline management
 * - Source verification
 * - Data export capabilities
 * 
 * Sources: Shiksha, USNews, CSRankings, university websites
 */
export default function UniversityResearchPage() {
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [universities, setUniversities] = useState<University[]>([
    {
      id: '1',
      name: 'Stanford University',
      location: 'Stanford, CA, USA',
      ranking: '#3 in National Universities (US News)',
      website: 'https://www.stanford.edu',
      researchStatus: 'completed',
      lastUpdated: '2024-12-10'
    },
    {
      id: '2',
      name: 'MIT',
      location: 'Cambridge, MA, USA',
      ranking: '#1 in National Universities (US News)',
      website: 'https://www.mit.edu',
      researchStatus: 'in_progress',
      lastUpdated: '2024-12-08'
    },
    {
      id: '3',
      name: 'University of Toronto',
      location: 'Toronto, ON, Canada',
      ranking: '#34 in Global Universities (US News)',
      website: 'https://www.utoronto.ca',
      researchStatus: 'pending',
      lastUpdated: '2024-12-05'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingUniversity, setIsAddingUniversity] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredUniversities = universities.filter(uni =>
    uni.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    uni.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageShell>
      <PageHeader
        title="University research"
        description="Research and maintain comprehensive university information for student guidance"
      />

      {/* Research Guidelines */}
      <Card className="mb-8 border-border bg-muted/40">
        <CardHeader>
          <CardTitle>Research guidelines and sources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground">Shiksha.com</h4>
              <p className="text-xs text-muted-foreground">Rankings, fees, programs</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground">US News</h4>
              <p className="text-xs text-muted-foreground">Official rankings, stats</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground">CSRankings</h4>
              <p className="text-xs text-muted-foreground">CS program rankings</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground">Official Sites</h4>
              <p className="text-xs text-muted-foreground">Deadlines, requirements</p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-foreground">
              <strong>Research Tasks:</strong> Find available courses, fees structure, rankings/ratings, 
              application deadlines, admission requirements, and contact information from official sources.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* University List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Universities</CardTitle>
                <Button 
                  size="sm" 
                  onClick={() => setIsAddingUniversity(true)}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search universities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredUniversities.map((university) => (
                  <div 
                    key={university.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedUniversity?.id === university.id 
                        ? 'border-primary bg-accent/30' 
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedUniversity(university)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm">{university.name}</h4>
                      <Badge className={getStatusColor(university.researchStatus)}>
                        {university.researchStatus.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{university.location}</p>
                    <p className="text-xs text-muted-foreground">
                      Updated: {new Date(university.lastUpdated).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Research Details */}
        <div className="lg:col-span-2">
          {selectedUniversity ? (
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="programs">Programs</TabsTrigger>
                <TabsTrigger value="fees">Fees</TabsTrigger>
                <TabsTrigger value="deadlines">Deadlines</TabsTrigger>
                <TabsTrigger value="sources">Sources</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Globe className="w-5 h-5" />
                      <span>{selectedUniversity.name}</span>
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(selectedUniversity.researchStatus)}>
                        {selectedUniversity.researchStatus.replace('_', ' ')}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Visit Website
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Location</Label>
                        <Input value={selectedUniversity.location} readOnly />
                      </div>
                      <div>
                        <Label>Ranking</Label>
                        <Input value={selectedUniversity.ranking} readOnly />
                      </div>
                    </div>
                    
                    <div>
                      <Label>Research Notes</Label>
                      <Textarea 
                        placeholder="Add research findings, key information, and notes..."
                        className="min-h-32"
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button className="bg-green-600 hover:bg-green-700">
                        <Save className="w-4 h-4 mr-2" />
                        Save Research
                      </Button>
                      <Button variant="outline">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="programs">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Academic Programs</CardTitle>
                      <Button size="sm" variant="outline">
                        <Plus className="w-4 h-4 mr-1" />
                        Add Program
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Sample Programs */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">MS in Computer Science</h4>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <p><strong>Duration:</strong> 2 years</p>
                          <p><strong>Fees:</strong> $58,000/year</p>
                          <p><strong>Deadline:</strong> December 15, 2024</p>
                          <p><strong>Requirements:</strong> GRE, TOEFL, 3 LORs</p>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">MS in Data Science</h4>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <p><strong>Duration:</strong> 1.5 years</p>
                          <p><strong>Fees:</strong> $55,000/year</p>
                          <p><strong>Deadline:</strong> January 15, 2025</p>
                          <p><strong>Requirements:</strong> GRE, TOEFL, Portfolio</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="fees">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <DollarSign className="w-5 h-5" />
                      <span>Fee Structure</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Tuition (per year)</Label>
                        <Input placeholder="$58,000" />
                      </div>
                      <div>
                        <Label>Living Expenses (per year)</Label>
                        <Input placeholder="$20,000" />
                      </div>
                      <div>
                        <Label>Application Fee</Label>
                        <Input placeholder="$125" />
                      </div>
                      <div>
                        <Label>Other Fees</Label>
                        <Input placeholder="$2,000" />
                      </div>
                    </div>
                    
                    <div>
                      <Label>Fee Notes</Label>
                      <Textarea placeholder="Additional information about scholarships, payment plans, etc." />
                    </div>
                    
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Save className="w-4 h-4 mr-2" />
                      Save Fee Information
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="deadlines">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <Calendar className="w-5 h-5" />
                        <span>Application Deadlines</span>
                      </CardTitle>
                      <Button size="sm" variant="outline">
                        <Plus className="w-4 h-4 mr-1" />
                        Add Deadline
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">MS Computer Science</p>
                          <p className="text-sm text-muted-foreground">Fall 2025 admission</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="destructive">Dec 15, 2024</Badge>
                          <p className="text-xs text-muted-foreground">Priority deadline</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">MS Data Science</p>
                          <p className="text-sm text-muted-foreground">Fall 2025 admission</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">Jan 15, 2025</Badge>
                          <p className="text-xs text-muted-foreground">Regular deadline</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sources">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Research Sources</CardTitle>
                      <Button size="sm" variant="outline">
                        <Plus className="w-4 h-4 mr-1" />
                        Add Source
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Stanford Official Website</p>
                          <p className="text-sm text-muted-foreground">https://www.stanford.edu/academics</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">Verified</Badge>
                          <p className="text-xs text-muted-foreground">Dec 10, 2024</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">US News Rankings</p>
                          <p className="text-sm text-muted-foreground">https://www.usnews.com/universities</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">Verified</Badge>
                          <p className="text-xs text-muted-foreground">Dec 10, 2024</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Select a university to start researching</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageShell>
  );
}


