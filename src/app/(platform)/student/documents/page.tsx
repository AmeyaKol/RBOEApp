"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader, PageShell } from "@/components/shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { CommentThread } from "@/components/features/CommentThread";
import {
  mapApiDocumentToViewModel,
  type ApiStudentDocumentRow,
  type DocumentViewModel,
} from "@/lib/view-models/document";
import { 
  FileText,
  Edit,
  History,
  Plus,
  Save,
  Download,
  Share,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react";

/**
 * Student Documents Page
 * 
 * Features:
 * - Rich text editor for SOPs and LORs
 * - Document collaboration with comments
 * - Version history
 * - University-specific document copies
 * 
 * SRS Requirements: 3.3.1, 3.3.2, 3.3.3, 3.3.4
 * User Stories: 1.2
 */
export default function StudentDocumentsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('sop');
  const [documents, setDocuments] = useState<DocumentViewModel[]>([]);
  const [currentDocument, setCurrentDocument] = useState<DocumentViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDocumentTitle, setNewDocumentTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [requestingReview, setRequestingReview] = useState(false);
  const [reviewRequested, setReviewRequested] = useState(false);
  const [historyDoc, setHistoryDoc] = useState<DocumentViewModel | null>(null);
  const [versions, setVersions] = useState<
    Array<{
      id: string;
      version: number;
      content: string | null;
      version_note: string | null;
      editor_name: string | null;
      editor_role: string | null;
      created_at: string;
    }>
  >([]);
  const [versionsLoading, setVersionsLoading] = useState(false);

  const openHistory = async (doc: DocumentViewModel) => {
    setHistoryDoc(doc);
    setVersionsLoading(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}/versions`);
      setVersions(res.ok ? await res.json() : []);
    } catch {
      setVersions([]);
    } finally {
      setVersionsLoading(false);
    }
  };

  const getErrorMessage = (err: unknown, fallback: string) =>
    err instanceof Error ? err.message : fallback;

  const normalizeDocument = (doc: Record<string, unknown>): DocumentViewModel => {
    const type = String(doc.type || "SOP").toUpperCase() as DocumentViewModel["type"];
    return {
      id: String(doc.id),
      type,
      title: String(doc.title || "Untitled"),
      content: String(doc.content || ""),
      isMaster: Boolean(doc.is_master ?? doc.isMaster),
      version: Number(doc.version ?? 1),
      createdAt: String(doc.created_at ?? doc.createdAt ?? ""),
      updatedAt: String(doc.updated_at ?? doc.updatedAt ?? ""),
    };
  };

  const fetchDocuments = async (): Promise<DocumentViewModel[]> => {
    try {
      setLoading(true);
      const response = await fetch('/api/student/documents');

      if (response.ok) {
        const data = (await response.json()) as ApiStudentDocumentRow[];
        const transformedDocuments: DocumentViewModel[] =
          data.map(mapApiDocumentToViewModel);
        setDocuments(transformedDocuments);

        const masterDoc = transformedDocuments.find(
          (doc) =>
            doc.type === (activeTab === 'sop' ? 'SOP' : 'LOR') && doc.isMaster
        );
        setCurrentDocument(masterDoc || null);
        setInitialized(true);
        return transformedDocuments;
      } else {
        throw new Error('Failed to fetch documents');
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError(getErrorMessage(err, 'Failed to load documents'));
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Create the master documents that don't exist yet. The POST endpoint is
  // idempotent for masters, so this is safe even if called with a stale view.
  const initializeDefaultDocuments = async (missingTypes: Array<'SOP' | 'LOR'>) => {
    try {
      const defaults: Record<'SOP' | 'LOR', { type: 'SOP' | 'LOR'; title: string; content: string; is_master: true }> = {
        SOP: {
          type: 'SOP',
          title: 'Master SOP',
          content: 'Start writing your Statement of Purpose here. This will be your master document that you can customize for different universities.',
          is_master: true,
        },
        LOR: {
          type: 'LOR',
          title: 'Master LOR',
          content: 'Start writing your Letter of Recommendation here. This will be your master document that you can customize for different universities.',
          is_master: true,
        },
      };

      for (const type of missingTypes) {
        await fetch('/api/student/documents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(defaults[type]),
        });
      }

      // Refresh documents after creating defaults
      await fetchDocuments();
    } catch (err) {
      console.error('Error initializing default documents:', err);
    }
  };

  // Main initialization effect
  useEffect(() => {
    if (user && !initialized) {
      fetchDocuments().then((docs) => {
        // Decide from the freshly fetched list, not stale state.
        const missing = (['SOP', 'LOR'] as const).filter(
          (type) => !docs.some((doc) => doc.type === type && doc.isMaster)
        );
        if (missing.length > 0) {
          initializeDefaultDocuments(missing);
        }
      });
    }
  }, [user, initialized]);

  // Update current document when tab changes
  useEffect(() => {
    if (documents.length > 0) {
      const masterDoc = documents.find(doc =>
        doc.type === (activeTab === 'sop' ? 'SOP' : 'LOR') && doc.isMaster
      );
      if (masterDoc) {
        setCurrentDocument(masterDoc);
        setReviewRequested(false);
      }
    }
  }, [activeTab, documents]);

  const handleSave = async () => {
    if (!currentDocument) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/student/documents/${currentDocument.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: currentDocument.content,
          title: currentDocument.title
        }),
      });

      if (response.ok) {
        const updatedDoc = normalizeDocument(await response.json());
        setDocuments((docs) =>
          docs.map(doc => doc.id === updatedDoc.id ? updatedDoc : doc)
        );
        setCurrentDocument(updatedDoc);
        console.log('Document saved successfully');
      } else {
        throw new Error('Failed to save document');
      }
    } catch (err) {
      console.error('Error saving document:', err);
      setError(getErrorMessage(err, 'Failed to save document'));
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    if (!currentDocument) return;
    
    const blob = new Blob([currentDocument.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentDocument.title}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShareWithAdmin = () => {
    if (!currentDocument) return;
    
    // Simulate sharing with admin
    console.log('Sharing document with admin:', currentDocument.title);
    alert('Document shared with admin for review');
  };

  const handleRequestReview = async () => {
    if (!currentDocument || requestingReview || reviewRequested) return;
    setRequestingReview(true);
    try {
      const response = await fetch('/api/student/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Review Request: ${currentDocument.title}`,
          description: `Please review my ${currentDocument.type} document "${currentDocument.title}".`,
          document_id: currentDocument.id,
        }),
      });
      if (!response.ok) throw new Error('Failed to submit review request');
      setReviewRequested(true);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to submit review request'));
    } finally {
      setRequestingReview(false);
    }
  };

  const handleCreateUniversityCopy = () => {
    setShowCreateModal(true);
  };

  const handleCreateCopy = async () => {
    if (!currentDocument || !newDocumentTitle) return;
    
    try {
      const response = await fetch('/api/student/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: currentDocument.type,
          title: newDocumentTitle,
          content: currentDocument.content,
          is_master: false
        }),
      });

      if (response.ok) {
        const newDoc = normalizeDocument(await response.json());
        setDocuments([...documents, newDoc]);
        setShowCreateModal(false);
        setNewDocumentTitle('');
        console.log('University copy created successfully');
      } else {
        throw new Error('Failed to create university copy');
      }
    } catch (err) {
      console.error('Error creating university copy:', err);
      setError(getErrorMessage(err, 'Failed to create university copy'));
    }
  };

  const universityDocuments = useMemo(
    () => documents.filter((doc) => !doc.isMaster),
    [documents]
  );

  if (loading) {
    return (
      <PageShell>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading documents...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Documents"
        description="Create and collaborate on your Statement of Purpose and Letters of Recommendation"
      />
      {error && (
        <div className="-mt-2 mb-6 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Document Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sop" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Statement of Purpose
          </TabsTrigger>
          <TabsTrigger value="lor" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Letters of Recommendation
          </TabsTrigger>
        </TabsList>
        
        {/* SOP Tab */}
        <TabsContent value="sop" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Document Editor */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{currentDocument?.title || 'Master SOP'}</CardTitle>
                      <CardDescription>
                        Your main Statement of Purpose that can be customized for different universities
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => currentDocument && openHistory(currentDocument)}
                        disabled={!currentDocument}
                      >
                        <History className="h-4 w-4 mr-2" />
                        Version History
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                      <Button size="sm" onClick={handleSave} disabled={saving}>
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={currentDocument?.content || ''}
                    onChange={(e) => setCurrentDocument(prev => prev ? { ...prev, content: e.target.value } : null)}
                    placeholder="Start writing your Statement of Purpose here..."
                    className="min-h-[400px] resize-none"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" onClick={handleCreateUniversityCopy}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create University Copy
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={handleShareWithAdmin}>
                    <Share className="h-4 w-4 mr-2" />
                    Share with Admin
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleRequestReview}
                    disabled={requestingReview || reviewRequested}
                  >
                    {reviewRequested ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                        Review Requested
                      </>
                    ) : requestingReview ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Requesting...
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4 mr-2" />
                        Request Review
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Comments */}
              <Card>
                <CardContent className="pt-6">
                  {currentDocument && <CommentThread documentId={currentDocument.id} />}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        {/* LOR Tab */}
        <TabsContent value="lor" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Document Editor */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{currentDocument?.title || 'Master LOR'}</CardTitle>
                      <CardDescription>
                        Your main Letter of Recommendation template
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => currentDocument && openHistory(currentDocument)}
                        disabled={!currentDocument}
                      >
                        <History className="h-4 w-4 mr-2" />
                        Version History
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                      <Button size="sm" onClick={handleSave} disabled={saving}>
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={currentDocument?.content || ''}
                    onChange={(e) => setCurrentDocument(prev => prev ? { ...prev, content: e.target.value } : null)}
                    placeholder="Start writing your Letter of Recommendation here..."
                    className="min-h-[400px] resize-none"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" onClick={handleCreateUniversityCopy}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create University Copy
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={handleShareWithAdmin}>
                    <Share className="h-4 w-4 mr-2" />
                    Share with Admin
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleRequestReview}
                    disabled={requestingReview || reviewRequested}
                  >
                    {reviewRequested ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                        Review Requested
                      </>
                    ) : requestingReview ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Requesting...
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4 mr-2" />
                        Request Review
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Comments */}
              <Card>
                <CardContent className="pt-6">
                  {currentDocument && <CommentThread documentId={currentDocument.id} />}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* University-Specific Documents */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>University-Specific Documents</CardTitle>
            <CardDescription>
              Customized versions of your documents for specific universities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {universityDocuments.length > 0 ? (
                universityDocuments.map((doc) => (
                  <div key={doc.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{doc.title}</h3>
                      <Badge variant="outline">
                        {doc.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Version {doc.version} • Updated {new Date(doc.updatedAt).toLocaleDateString()}
                    </p>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setCurrentDocument(doc)}
                      >
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          const blob = new Blob([doc.content], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${doc.title}.txt`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }}
                      >
                        Export
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground">No university-specific documents yet</p>
                  <p className="text-sm text-muted-foreground mt-2">Create copies for specific universities using the &quot;Create University Copy&quot; button</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Version History Modal */}
      {historyDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="flex max-h-[85vh] w-full max-w-2xl flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Version history — {historyDoc.title}</CardTitle>
                  <CardDescription>
                    Currently v{historyDoc.version}. Earlier versions are read-only.
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setHistoryDoc(null)}>
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {versionsLoading ? (
                <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : versions.length === 0 ? (
                <p className="py-6 text-sm text-muted-foreground">
                  No earlier versions yet. Saving an edit records one.
                </p>
              ) : (
                <ul className="space-y-3">
                  {versions.map((v) => (
                    <li key={v.id} className="rounded-lg border p-3">
                      <div className="mb-1 flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-medium">v{v.version}</span>
                        <Badge
                          variant="outline"
                          className={
                            v.editor_role === "ADMIN"
                              ? "bg-indigo-100 text-indigo-800"
                              : "bg-slate-100 text-slate-700"
                          }
                        >
                          {v.editor_name || v.editor_role || "Unknown"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(v.created_at).toLocaleString()}
                        </span>
                        {v.version_note && (
                          <span className="text-xs text-muted-foreground">— {v.version_note}</span>
                        )}
                      </div>
                      <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded bg-muted p-2 text-xs">
                        {v.content || "(empty)"}
                      </pre>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create University Copy Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create University Copy</CardTitle>
              <CardDescription>
                Create a customized version of your document for a specific university
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Document Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Stanford SOP"
                  value={newDocumentTitle}
                  onChange={(e) => setNewDocumentTitle(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewDocumentTitle('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateCopy}
                  disabled={!newDocumentTitle}
                >
                  Create Copy
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageShell>
  );
} 