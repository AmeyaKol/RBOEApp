import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

/**
 * Supabase Client Configuration
 * 
 * This file provides configured Supabase clients for client-side operations.
 * 
 * Features:
 * - Client-side authentication and real-time subscriptions
 * - Type-safe database operations
 */

/**
 * Client-side Supabase client
 * Use this in client components and pages
 */
export const createClient = () => {
  // Ensure we're on the client side
  if (typeof window === 'undefined') {
    throw new Error('Supabase client can only be used on the client side');
  }
  
  return createClientComponentClient()
}

/**
 * Database Types
 * These will be auto-generated from the database schema
 */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string | null
          role: 'STUDENT' | 'ADMIN'
          gre_score: number | null
          toefl_score: number | null
          undergrad_gpa: number | null
          work_experience_months: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name?: string | null
          role: 'STUDENT' | 'ADMIN'
          gre_score?: number | null
          toefl_score?: number | null
          undergrad_gpa?: number | null
          work_experience_months?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string | null
          role?: 'STUDENT' | 'ADMIN'
          gre_score?: number | null
          toefl_score?: number | null
          undergrad_gpa?: number | null
          work_experience_months?: number | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'STUDENT' | 'ADMIN'
    }
  }
} 