"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { signUpWithPassword, createUserProfile, updateUserProfile } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, Loader2, GraduationCap } from "lucide-react";

/**
 * Student Registration Form Component
 *
 * Features:
 * - Student account creation with academic information
 * - Form validation and error handling
 * - Loading states and success feedback
 * - Automatic profile creation
 */
export function RegisterForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    greScore: '',
    toeflScore: '',
    undergradGpa: '',
    workExperience: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const { refreshProfile } = useAuth();
  const getErrorMessage = (err: unknown, fallback: string) =>
    err instanceof Error ? err.message : fallback;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.greScore && (parseInt(formData.greScore) < 260 || parseInt(formData.greScore) > 340)) {
      setError('GRE score must be between 260 and 340');
      return false;
    }
    if (formData.toeflScore && (parseInt(formData.toeflScore) < 0 || parseInt(formData.toeflScore) > 120)) {
      setError('TOEFL score must be between 0 and 120');
      return false;
    }
    if (formData.undergradGpa && (parseFloat(formData.undergradGpa) < 0 || parseFloat(formData.undergradGpa) > 4.0)) {
      setError('Undergraduate GPA must be between 0.0 and 4.0');
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
      // Sign up with Supabase (student role is default)
      const { user } = await signUpWithPassword(
        formData.email,
        formData.password,
        'STUDENT', // Fixed role for students
        formData.fullName
      );

      if (user) {
        console.log('User created successfully:', user.id);
        
        // Create user profile with academic information
        const profile = await createUserProfile(
          user.id,
          'STUDENT', // Fixed role for students
          formData.fullName
        );

        if (profile) {
          console.log('Profile created/retrieved successfully:', profile);

        // Update profile with academic data if provided
        if (formData.greScore || formData.toeflScore || formData.undergradGpa || formData.workExperience) {
          const updates: Record<string, number> = {};
          if (formData.greScore) updates.gre_score = parseInt(formData.greScore);
          if (formData.toeflScore) updates.toefl_score = parseInt(formData.toeflScore);
          if (formData.undergradGpa) updates.undergrad_gpa = parseFloat(formData.undergradGpa);
          if (formData.workExperience) updates.work_experience_months = parseInt(formData.workExperience);

            // Update the profile with academic data
            const updatedProfile = await updateUserProfile(user.id, updates);
            if (updatedProfile) {
              console.log('Profile updated with academic data:', updatedProfile);
            }
        }

        // Refresh the profile to ensure it's loaded in the auth context
        await refreshProfile();

        setSuccess(true);

        // Redirect to student dashboard after a brief delay
        setTimeout(() => {
          router.push('/student/dashboard');
        }, 2000);
        } else {
          throw new Error('Failed to create user profile');
        }
      } else {
        throw new Error('User creation failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      const message = getErrorMessage(err, 'An error occurred during registration');
      
      // Handle specific error cases
      if (message.includes('Email not confirmed')) {
        setError('Please check your email and confirm your account before signing in.');
      } else if (message.includes('already registered')) {
        setError('An account with this email already exists. Please sign in instead.');
      } else {
      setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.fullName && formData.email && formData.password &&
                     formData.confirmPassword && formData.password === formData.confirmPassword;

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center text-green-600">Registration Successful!</CardTitle>
          <CardDescription className="text-center">
            Welcome to RBOE
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="text-green-600">
              <GraduationCap className="h-12 w-12 mx-auto mb-2" />
              <p className="text-sm">Your student account has been created successfully.</p>
              <p className="text-sm">Redirecting to your dashboard...</p>
            </div>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Create Student Account</CardTitle>
        <CardDescription className="text-center">
          Join RBOE and start your graduate school journey
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="student@university.edu"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                disabled={loading}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                disabled={loading}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Academic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="greScore">GRE Score (Optional)</Label>
              <Input
                id="greScore"
                type="number"
                min="260"
                max="340"
                placeholder="320"
                value={formData.greScore}
                onChange={(e) => handleInputChange('greScore', e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="toeflScore">TOEFL Score (Optional)</Label>
              <Input
                id="toeflScore"
                type="number"
                min="0"
                max="120"
                placeholder="100"
                value={formData.toeflScore}
                onChange={(e) => handleInputChange('toeflScore', e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="undergradGpa">Undergrad GPA (Optional)</Label>
              <Input
                id="undergradGpa"
                type="number"
                step="0.01"
                min="0"
                max="4.0"
                placeholder="3.5"
                value={formData.undergradGpa}
                onChange={(e) => handleInputChange('undergradGpa', e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workExperience">Work Experience (Months)</Label>
              <Input
                id="workExperience"
                type="number"
                min="0"
                placeholder="12"
                value={formData.workExperience}
                onChange={(e) => handleInputChange('workExperience', e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!isFormValid || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating student account...
              </>
            ) : (
              <>
                Create Student Account
              </>
            )}
          </Button>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-primary hover:underline underline-offset-4"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-primary underline underline-offset-4"
          >
            ← Back to Home
          </Link>
        </div>
      </CardContent>
    </Card>
  );
} 