import { createClient } from './supabase'
import { User } from '@supabase/auth-helpers-nextjs'

/**
 * Authentication Utilities
 * 
 * This file contains helper functions for authentication operations,
 * role management, and user profile handling.
 */

export type UserRole = 'STUDENT' | 'ADMIN'

export interface UserProfile {
  id: string
  user_id: string
  full_name: string | null
  role: UserRole
  gre_score: number | null
  toefl_score: number | null
  undergrad_gpa: number | null
  work_experience_months: number | null
  created_at: string
  updated_at: string
}

export interface AuthUser extends User {
  profile?: UserProfile
}

/**
 * Get the current user's profile from the database
 */
export async function getUserProfile(userId: string): Promise<UserProfile | undefined> {
  const supabase = createClient()
  
  try {
    console.log('Fetching profile for user:', userId);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Supabase error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      if (error.code === 'PGRST116') {
        // No rows returned - profile doesn't exist yet
        console.log('Profile not found for user:', userId);
        
        // Try to create a default profile
        try {
          console.log('Attempting to create default profile...');
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              user_id: userId,
              full_name: 'User',
              role: 'STUDENT' // Default role
            })
            .select()
            .single();
            
          if (createError) {
            console.error('Error creating default profile:', createError);
            return undefined;
          }
          
          console.log('Default profile created:', newProfile);
          return newProfile;
        } catch (createError) {
          console.error('Unexpected error creating profile:', createError);
          return undefined;
        }
      }
      console.error('Error fetching user profile:', error);
      return undefined;
    }

    console.log('Profile found:', data);
    return data;
  } catch (error) {
    console.error('Unexpected error fetching user profile:', error);
    return undefined;
  }
}

/**
 * Create a new user profile after registration
 */
export async function createUserProfile(
  userId: string, 
  role: UserRole, 
  fullName?: string
): Promise<UserProfile | null> {
  const supabase = createClient()
  
  try {
    // First check if profile already exists (due to database trigger)
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (existingProfile) {
      console.log('Profile already exists, returning existing profile');
      return existingProfile;
    }

    // If no profile exists, create one
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      user_id: userId,
      role,
      full_name: fullName || null,
    })
    .select()
    .single()

  if (error) {
      console.error('Error creating user profile:', error);
      
      // If it's a unique constraint violation, try to fetch the existing profile
      if (error.code === '23505') {
        console.log('Profile already exists (constraint violation), fetching existing profile');
        const { data: existingData, error: fetchError2 } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
          
        if (fetchError2) {
          console.error('Error fetching existing profile:', fetchError2);
          return null;
        }
        
        return existingData;
      }
      
      return null;
  }

    return data;
  } catch (error) {
    console.error('Unexpected error in createUserProfile:', error);
    return null;
  }
}

/**
 * Update user profile information
 */
export async function updateUserProfile(
  userId: string, 
  updates: Partial<Omit<UserProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<UserProfile | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating user profile:', error)
    return null
  }

  return data
}

/**
 * Check if user has a specific role
 */
export function hasRole(user: AuthUser | null, role: UserRole): boolean {
  return user?.profile?.role === role
}

/**
 * Check if user is a student
 */
export function isStudent(user: AuthUser | null): boolean {
  return hasRole(user, 'STUDENT')
}

/**
 * Check if user is an admin
 */
export function isAdmin(user: AuthUser | null): boolean {
  return hasRole(user, 'ADMIN')
}

/**
 * Get the appropriate dashboard route for a user's role
 */
export function getDashboardRoute(role: UserRole): string {
  switch (role) {
    case 'STUDENT':
      return '/student/dashboard'
    case 'ADMIN':
      return '/admin/dashboard'
    default:
      return '/login'
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithPassword(email: string, password: string) {
  const supabase = createClient()
  
  try {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
      console.error('Sign in error:', error);
      
      // Handle specific error cases with better messages
      if (error.message.includes('Email not confirmed')) {
        throw new Error('Email not confirmed. Please check your email and confirm your account before signing in. If you have disabled email confirmation in Supabase settings, try registering a new account.');
      }
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      }
      if (error.message.includes('Too many requests')) {
        throw new Error('Too many login attempts. Please wait a moment before trying again.');
      }
      
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
}

/**
 * Sign up a new user
 */
export async function signUpWithPassword(
  email: string, 
  password: string, 
  role: UserRole,
  fullName?: string
) {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          full_name: fullName,
        }
      }
    })

    if (error) {
      console.error('Supabase signup error:', error);
      
      // Provide more specific error messages
      if (error.message.includes('invalid')) {
        throw new Error(`Email validation error: ${error.message}`);
      }
      if (error.message.includes('already registered')) {
        throw new Error('An account with this email already exists');
      }
      if (error.message.includes('domain')) {
        throw new Error('This email domain is not allowed. Please try a different email address.');
      }
      
      // Show the actual error message from Supabase
      throw new Error(error.message);
    }

    // If email confirmation is disabled, the user should be automatically signed in
    if (data.user && !data.user.email_confirmed_at) {
      console.log('User created but email not confirmed. This is expected if email confirmation is disabled.');
      
      // Try to sign in immediately if email confirmation is disabled
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('Auto sign-in error:', signInError);
        // Don't throw here, let the user try to sign in manually
      } else {
        console.log('Auto sign-in successful');
        return signInData;
      }
    }

    return data;
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const supabase = createClient()
  
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    throw error
  }
} 