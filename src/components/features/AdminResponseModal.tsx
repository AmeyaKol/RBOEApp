"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Send, Loader2, MessageSquare, AlertCircle, User, Clock } from "lucide-react";

interface AdminResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestUpdated: (updatedRequest?: {
    id: string;
    status: string;
    admin_response?: string;
    updated_at: string;
    responded_at?: string;
  }) => void;
  request: {
    id: string;
    status: string;
    is_urgent?: boolean;
    title: string;
    profiles?: {
      full_name?: string;
      gre_score?: number;
      toefl_score?: number;
    };
    created_at: string;
    updated_at?: string;
    description: string;
    urgent_reason?: string;
    admin_response?: string;
    responded_at?: string;
  } | null;
}

/**
 * Admin Response Modal Component
 * 
 * Features:
 * - View request details
 * - Respond to student requests
 * - Update request status
 * - Mark as in progress or completed
 */
export function AdminResponseModal({ isOpen, onClose, onRequestUpdated, request }: AdminResponseModalProps) {
  const getErrorMessage = (err: unknown, fallback: string) =>
    err instanceof Error ? err.message : fallback;

  const [response, setResponse] = useState('');
  const [status, setStatus] = useState(request?.status || 'OPEN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStatus(request?.status || 'OPEN');
    setResponse('');
    setError(null);
  }, [request]);

  const isUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request) return;
    setLoading(true);
    setError(null);

    try {
      const updateData: Record<string, string> = {
        status: status
      };

      if (response.trim()) {
        updateData.admin_response = response.trim();
      }

      const nowIso = new Date().toISOString();
      if (!isUuid(request.id)) {
        onRequestUpdated({
          id: request.id,
          status,
          admin_response: updateData.admin_response,
          updated_at: nowIso,
          responded_at: updateData.admin_response ? nowIso : request.responded_at,
        });
      } else {
        const apiResponse = await fetch(`/api/admin/requests/${request.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });

        if (!apiResponse.ok) {
          throw new Error('Failed to update request');
        }

        const updated = await apiResponse.json() as { id: string; status?: string; admin_response?: string; updated_at?: string; responded_at?: string };
        onRequestUpdated({
          id: updated.id || request.id,
          status: updated.status || status,
          admin_response: updated.admin_response ?? updateData.admin_response,
          updated_at: updated.updated_at || nowIso,
          responded_at: updated.responded_at || (updateData.admin_response ? nowIso : request.responded_at),
        });
      }

      // Reset form
      setResponse('');
      setStatus('OPEN');

      onClose();
    } catch (err) {
      setError(getErrorMessage(err, 'An error occurred while updating the request'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (requestStatus: string) => {
    switch (requestStatus) {
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

  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Respond to Request
              </CardTitle>
              <CardDescription>
                Review and respond to student request
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={loading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Request Details */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {request.is_urgent && <AlertCircle className="h-4 w-4 text-red-600" />}
                  <Badge className={getStatusColor(request.status)}>
                    {request.status.replace('_', ' ')}
                  </Badge>
                  {request.is_urgent && <Badge variant="destructive">Urgent</Badge>}
                </div>
                <h3 className="font-semibold text-lg">{request.title}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{request.profiles?.full_name || 'Student'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Submitted {new Date(request.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Request Description:</h4>
              <p className="text-sm">{request.description}</p>
            </div>

            {request.is_urgent && request.urgent_reason && (
              <div className="p-3 bg-red-50 rounded-lg">
                <h4 className="font-medium text-red-800 mb-1">Urgent Reason:</h4>
                <p className="text-sm text-red-700">{request.urgent_reason}</p>
              </div>
            )}

            {request.admin_response && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-1">Previous Response:</h4>
                <p className="text-sm text-blue-700">{request.admin_response}</p>
                {request.responded_at && (
                  <p className="text-xs text-blue-600 mt-1">
                    Responded on {new Date(request.responded_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Response Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="status">Update Status</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full p-2 border rounded-md"
                disabled={loading}
              >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="CLOSED">Completed</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="response">Your Response</Label>
              <Textarea
                id="response"
                placeholder="Provide a detailed response to the student..."
                rows={6}
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Response
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 