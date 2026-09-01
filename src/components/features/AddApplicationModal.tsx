"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Loader2 } from "lucide-react";

interface AddApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplicationAdded: () => void;
}

/**
 * Add Application Modal Component
 * 
 * Features:
 * - Form for adding new university applications
 * - Form validation
 * - Status selection
 * - Deadline and fee tracking
 */
export function AddApplicationModal({ isOpen, onClose, onApplicationAdded }: AddApplicationModalProps) {
  const getErrorMessage = (err: unknown, fallback: string) =>
    err instanceof Error ? err.message : fallback;

  const [formData, setFormData] = useState({
    university_name: '',
    program_name: '',
    status: 'RESEARCHING',
    deadline: '',
    application_fee: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/student/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          application_fee: formData.application_fee ? parseFloat(formData.application_fee) : null,
          deadline: formData.deadline || null
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create application');
      }

      // Reset form
      setFormData({
        university_name: '',
        program_name: '',
        status: 'RESEARCHING',
        deadline: '',
        application_fee: ''
      });

      onApplicationAdded();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, 'An error occurred while creating the application'));
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: 'RESEARCHING', label: 'Researching', color: 'bg-gray-100 text-gray-800' },
    { value: 'APPLYING', label: 'Applying', color: 'bg-blue-100 text-blue-800' },
    { value: 'APPLIED', label: 'Applied', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'ACCEPTED', label: 'Accepted', color: 'bg-green-100 text-green-800' },
    { value: 'REJECTED', label: 'Rejected', color: 'bg-red-100 text-red-800' },
    { value: 'WAITLISTED', label: 'Waitlisted', color: 'bg-purple-100 text-purple-800' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Add New Application</CardTitle>
              <CardDescription>
                Track a new university application
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
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="university_name">University Name *</Label>
              <Input
                id="university_name"
                type="text"
                placeholder="e.g., Stanford University"
                value={formData.university_name}
                onChange={(e) => handleInputChange('university_name', e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="program_name">Program Name</Label>
              <Input
                id="program_name"
                type="text"
                placeholder="e.g., MS Computer Science"
                value={formData.program_name}
                onChange={(e) => handleInputChange('program_name', e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Application Status</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full p-2 border rounded-md"
                disabled={loading}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-muted-foreground">Current status:</span>
                <Badge className={statusOptions.find(opt => opt.value === formData.status)?.color}>
                  {statusOptions.find(opt => opt.value === formData.status)?.label}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deadline">Application Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => handleInputChange('deadline', e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="application_fee">Application Fee ($)</Label>
                <Input
                  id="application_fee"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="125.00"
                  value={formData.application_fee}
                  onChange={(e) => handleInputChange('application_fee', e.target.value)}
                  disabled={loading}
                />
              </div>
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
                disabled={!formData.university_name || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Application
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