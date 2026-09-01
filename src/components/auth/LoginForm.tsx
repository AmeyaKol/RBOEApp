"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { signInWithPassword, getDashboardRoute } from "@/lib/auth";
import { GraduationCap, Shield, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

/**
 * Tabbed Login Form Component
 * 
 * Features:
 * - Separate tabs for student and admin login
 * - Form validation and error handling
 * - Loading states and success feedback
 * - Role-based redirects after login
 */
export function LoginForm() {
  const getErrorMessage = (err: unknown, fallback: string) =>
    err instanceof Error ? err.message : fallback;

  const [activeTab, setActiveTab] = useState<'student' | 'admin'>('student');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, refreshProfile } = useAuth();

  // Redirect if already authenticated (only if not in the middle of login)
  useEffect(() => {
    if (user && user.profile?.role && !loading) {
      const redirectTo = searchParams.get('redirectTo');
      const dashboardRoute = getDashboardRoute(user.profile.role);
      router.push(redirectTo || dashboardRoute);
    }
  }, [user, router, searchParams, loading]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Sign in with Supabase
      const { user: authUser } = await signInWithPassword(formData.email, formData.password);
      
      if (authUser) {
        // Refresh profile to get latest data including role
        await refreshProfile();
        
        // Force a small delay to ensure profile is loaded
        setTimeout(() => {
          // Manually redirect based on the active tab
          const role = activeTab === 'admin' ? 'ADMIN' : 'STUDENT';
          const dashboardRoute = getDashboardRoute(role);
          router.push(dashboardRoute);
        }, 500);
      }
    } catch (err) {
      console.error('Login error:', err);
      const message = getErrorMessage(err, 'An error occurred during login');
      
      // Handle email confirmation error specifically
      if (message.includes('Email not confirmed')) {
        setError('Email not confirmed. If you have disabled email confirmation in Supabase settings, please try registering a new account or contact support.');
      } else {
      setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.email && formData.password;

  // Show loading state while auth is being checked
  if (authLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Loading...</CardTitle>
          <CardDescription className="text-center">
            Please wait while we check your authentication status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderLoginContent = (role: 'student' | 'admin') => {
    const isStudent = role === 'student';
    
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <Label htmlFor={`${role}-email`}>Email Address</Label>
          <Input
            id={`${role}-email`}
            type="email"
            placeholder={isStudent ? "student@university.edu" : "admin@rboe.edu"}
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${role}-password`}>Password</Label>
          <div className="relative">
            <Input
              id={`${role}-password`}
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
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

        <Button 
          type="submit" 
          className="w-full" 
          disabled={!isFormValid || loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign in as {isStudent ? 'Student' : 'Admin'}
            </>
          )}
        </Button>

        {/* Forgot Password Link */}
        <div className="text-center">
          <Link 
            href="/forgot-password" 
            className="text-sm text-muted-foreground hover:text-primary underline underline-offset-4"
          >
            Forgot your password?
          </Link>
        </div>

        {/* Student Registration Link */}
        {isStudent && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link 
                href="/register" 
                className="text-primary hover:underline underline-offset-4"
              >
                Register here
              </Link>
            </p>
          </div>
        )}

        {/* Admin Note */}
        {!isStudent && (
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Admin accounts are created by system administrators only.
            </p>
          </div>
        )}
      </form>
    );
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
        <CardDescription className="text-center">
          Choose your account type to continue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'student' | 'admin')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="student" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Student
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Admin
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="student" className="mt-6">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-medium">Student Portal</h3>
                <p className="text-sm text-muted-foreground">
                  Access your application dashboard and documents
                </p>
              </div>
              {renderLoginContent('student')}
            </div>
          </TabsContent>
          
          <TabsContent value="admin" className="mt-6">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-medium">Admin Portal</h3>
                <p className="text-sm text-muted-foreground">
                  Manage students and application processes
                </p>
              </div>
              {renderLoginContent('admin')}
            </div>
          </TabsContent>
        </Tabs>

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