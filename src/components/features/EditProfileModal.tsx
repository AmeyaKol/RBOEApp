"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Save, Loader2, User } from "lucide-react";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated: () => void;
  currentProfile: {
    full_name?: string;
    gre_score?: number;
    toefl_score?: number;
    undergrad_gpa?: number;
    work_experience_months?: number;
  } | null;
}

/**
 * Edit Profile Modal Component
 * 
 * Features:
 * - Edit personal information
 * - Update academic scores (GRE, TOEFL, GPA)
 * - Update work experience
 * - Form validation
 */
export function EditProfileModal({ isOpen, onClose, onProfileUpdated, currentProfile }: EditProfileModalProps) {
  const getErrorMessage = (err: unknown, fallback: string) =>
    err instanceof Error ? err.message : fallback;

  const [formData, setFormData] = useState({
    full_name: '',
    gre_score: '',
    toefl_score: '',
    undergrad_gpa: '',
    work_experience_months: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update form data when currentProfile changes
  useEffect(() => {
    if (currentProfile) {
      setFormData({
        full_name: currentProfile.full_name || '',
        gre_score: currentProfile.gre_score?.toString() || '',
        toefl_score: currentProfile.toefl_score?.toString() || '',
        undergrad_gpa: currentProfile.undergrad_gpa?.toString() || '',
        work_experience_months: currentProfile.work_experience_months?.toString() || ''
      });
    }
  }, [currentProfile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) setError(null);
  };

  const validateForm = () => {
    if (!formData.full_name.trim()) {
      setError('Full name is required');
      return false;
    }
    
    if (formData.gre_score && (parseInt(formData.gre_score) < 260 || parseInt(formData.gre_score) > 340)) {
      setError('GRE score must be between 260 and 340');
      return false;
    }
    
    if (formData.toefl_score && (parseInt(formData.toefl_score) < 0 || parseInt(formData.toefl_score) > 120)) {
      setError('TOEFL score must be between 0 and 120');
      return false;
    }
    
    if (formData.undergrad_gpa && (parseFloat(formData.undergrad_gpa) < 0 || parseFloat(formData.undergrad_gpa) > 4.0)) {
      setError('Undergraduate GPA must be between 0.0 and 4.0');
      return false;
    }
    
    if (formData.work_experience_months && parseInt(formData.work_experience_months) < 0) {
      setError('Work experience cannot be negative');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const updateData: Record<string, string | number> = {
        full_name: formData.full_name.trim()
      };

      // Only include academic fields if they have values
      if (formData.gre_score) {
        updateData.gre_score = parseInt(formData.gre_score);
      }
      if (formData.toefl_score) {
        updateData.toefl_score = parseInt(formData.toefl_score);
      }
      if (formData.undergrad_gpa) {
        updateData.undergrad_gpa = parseFloat(formData.undergrad_gpa);
      }
      if (formData.work_experience_months) {
        updateData.work_experience_months = parseInt(formData.work_experience_months);
      }

      const response = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      onProfileUpdated();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, 'An error occurred while updating the profile'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Edit Profile
              </CardTitle>
              <CardDescription>
                Update your personal and academic information
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

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Personal Information
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  type="text"
                  placeholder="Your full name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Academic Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Academic Information
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gre_score">GRE Score</Label>
                  <Input
                    id="gre_score"
                    type="number"
                    min="260"
                    max="340"
                    placeholder="320"
                    value={formData.gre_score}
                    onChange={(e) => handleInputChange('gre_score', e.target.value)}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">Range: 260-340</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="toefl_score">TOEFL Score</Label>
                  <Input
                    id="toefl_score"
                    type="number"
                    min="0"
                    max="120"
                    placeholder="100"
                    value={formData.toefl_score}
                    onChange={(e) => handleInputChange('toefl_score', e.target.value)}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">Range: 0-120</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="undergrad_gpa">Undergrad GPA</Label>
                  <Input
                    id="undergrad_gpa"
                    type="number"
                    step="0.01"
                    min="0"
                    max="4.0"
                    placeholder="3.75"
                    value={formData.undergrad_gpa}
                    onChange={(e) => handleInputChange('undergrad_gpa', e.target.value)}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">Range: 0.0-4.0</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="work_experience_months">Work Experience</Label>
                  <Input
                    id="work_experience_months"
                    type="number"
                    min="0"
                    placeholder="24"
                    value={formData.work_experience_months}
                    onChange={(e) => handleInputChange('work_experience_months', e.target.value)}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">In months</p>
                </div>
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
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
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