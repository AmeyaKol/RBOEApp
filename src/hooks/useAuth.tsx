"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { AuthUser, getUserProfile } from '@/lib/auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshProfile: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const refreshProfile = async () => {
    if (user?.id && mounted) {
      try {
        const profile = await getUserProfile(user.id);
        setUser({
          ...user,
          profile
        });
      } catch (error) {
        console.error('Error refreshing profile:', error);
      }
    }
  };

  // Ensure we're on the client side
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    let isActive = true;
    type ClientInstance = ReturnType<typeof createClient>;
    let supabase: ClientInstance;

    // Safety timeout — if auth hasn't resolved in 8 s (e.g. stale session, hung profile
    // fetch, expired refresh token), unblock the UI so pages don't spin forever.
    const safetyTimer = setTimeout(() => {
      if (isActive) setLoading(false);
    }, 8000);

    const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T | undefined> =>
      Promise.race([
        promise,
        new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), ms)),
      ]);

    // Get initial session
    const getInitialSession = async () => {
      try {
        supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (isActive && session?.user) {
          const profile = await withTimeout(getUserProfile(session.user.id), 5000);
          setUser({
            ...session.user,
            profile
          });
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const setupAuthListener = async () => {
      try {
        supabase = createClient();
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!isActive) return;

            try {
              if (session?.user) {
                const profile = await withTimeout(getUserProfile(session.user.id), 5000);
                setUser({
                  ...session.user,
                  profile
                });
              } else {
                setUser(null);
              }
            } catch (error) {
              console.error('Error in auth state change:', error);
            } finally {
              setLoading(false);
            }
          }
        );

        return subscription;
      } catch (error) {
        console.error('Error setting up auth listener:', error);
        return null;
      }
    };

    let subscription: { unsubscribe: () => void } | null = null;
    setupAuthListener().then(sub => {
      subscription = sub;
    });

    return () => {
      isActive = false;
      clearTimeout(safetyTimer);
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [mounted]);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <AuthContext.Provider value={{ user: null, loading: true, refreshProfile: async () => {} }}>
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
} 