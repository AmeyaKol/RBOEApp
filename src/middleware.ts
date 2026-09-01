import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware for Route Protection and Role-Based Access Control
 * 
 * This middleware handles:
 * - Authentication checks for protected routes
 * - Role-based access control for student/admin areas
 * - Redirects for unauthenticated users
 * - Dashboard routing based on user roles
 */

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { pathname } = req.nextUrl

  // Get the current session
  const { data: { session } } = await supabase.auth.getSession()

  // Define protected routes
  const protectedRoutes = ['/student', '/admin']
  const authRoutes = ['/login', '/register']
  
  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  // Redirect authenticated users away from auth pages
  if (session && isAuthRoute) {
    // Get user profile to determine role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    if (profile) {
      const dashboardUrl = profile.role === 'ADMIN' 
        ? new URL('/admin/dashboard', req.url)
        : new URL('/student/dashboard', req.url)
      
      return NextResponse.redirect(dashboardUrl)
    }
  }

  // Redirect unauthenticated users from protected routes
  if (!session && isProtectedRoute) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Role-based access control for authenticated users
  if (session && isProtectedRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    if (profile) {
      const userRole = profile.role
      
      // Admin trying to access student routes - allow (admins can access everything)
      if (userRole === 'ADMIN' && pathname.startsWith('/student')) {
        return res
      }
      
      // Student trying to access admin routes - redirect to student dashboard
      if (userRole === 'STUDENT' && pathname.startsWith('/admin')) {
        const studentDashboard = new URL('/student/dashboard', req.url)
        return NextResponse.redirect(studentDashboard)
      }
      
      // Admin accessing admin routes - allow
      if (userRole === 'ADMIN' && pathname.startsWith('/admin')) {
        return res
      }
      
      // Student accessing student routes - allow
      if (userRole === 'STUDENT' && pathname.startsWith('/student')) {
        return res
      }
    } else {
      // No profile found - redirect to login
      const loginUrl = new URL('/login', req.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 