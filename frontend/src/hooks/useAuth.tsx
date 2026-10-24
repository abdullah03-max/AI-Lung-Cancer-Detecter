import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  isLiveSupabase: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isSupabaseConfigured) {
      // Initialize with Supabase session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            fullName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
            createdAt: session.user.created_at,
          });
          setToken(session.access_token);
        }
        setLoading(false);
      });

      // Listen for auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            fullName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
            createdAt: session.user.created_at,
          });
          setToken(session.access_token);
        } else {
          setUser(null);
          setToken(null);
        }
        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Local development session check from localStorage
      const cached = localStorage.getItem('lung_cancer_ai_demo_user');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setUser(parsed.user);
          setToken(parsed.token);
        } catch {
          // ignore corrupted local storage
        }
      }
      setLoading(false);
    }
  }, []);

  const signUp = async (email: string, password: string, fullName: string): Promise<{ error?: string }> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) return { error: error.message };
      if (data.session) {
        setToken(data.session.access_token);
        setUser({
          id: data.user!.id,
          email: data.user!.email,
          fullName,
          createdAt: data.user!.created_at,
        });
      }
      return {};
    } else {
      // Development mock session
      const mockId = 'usr_' + Math.random().toString(36).substring(2, 9);
      // Create a mock base64 token
      const mockToken = btoa(JSON.stringify({ sub: mockId, email, user_metadata: { full_name: fullName } }));
      const mockUser: UserProfile = {
        id: mockId,
        email,
        fullName,
        createdAt: new Date().toISOString(),
      };
      setUser(mockUser);
      setToken(mockToken);
      localStorage.setItem('lung_cancer_ai_demo_user', JSON.stringify({ user: mockUser, token: mockToken }));
      return {};
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error: error.message };
      if (data.session) {
        setToken(data.session.access_token);
        setUser({
          id: data.user.id,
          email: data.user.email,
          fullName: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
          createdAt: data.user.created_at,
        });
      }
      return {};
    } else {
      // Dev mode fallback login
      const mockId = 'demo-user-12345';
      const mockToken = btoa(JSON.stringify({ sub: mockId, email, user_metadata: { full_name: 'Dr. Researcher' } }));
      const mockUser: UserProfile = {
        id: mockId,
        email,
        fullName: 'Dr. Researcher',
        createdAt: new Date().toISOString(),
      };
      setUser(mockUser);
      setToken(mockToken);
      localStorage.setItem('lung_cancer_ai_demo_user', JSON.stringify({ user: mockUser, token: mockToken }));
      return {};
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('lung_cancer_ai_demo_user');
  };

  const resetPassword = async (email: string): Promise<{ error?: string }> => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) return { error: error.message };
    }
    return {};
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        isLiveSupabase: isSupabaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
