"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (displayName: string, avatarUrl?: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check active session on mount
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);


  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        setUser(data.user);
        return { success: true };
      }

      return { success: false, error: "Login failed" };
    } catch (error: any) {
      console.error("Login error:", error);
      return { success: false, error: error.message || "An unexpected error occurred" };
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined,
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        return { success: true };
      }

      return { success: false, error: "Registration failed" };
    } catch (error: any) {
      return { success: false, error: error.message || "An unexpected error occurred" };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const updateProfile = async (displayName: string, avatarUrl?: string) => {
    try {
      console.log('Updating profile:', { displayName, avatarUrl });
      const { data, error } = await supabase.auth.updateUser({
        data: {
          display_name: displayName,
          avatar_url: avatarUrl
        }
      });

      if (error) {
        console.error('Profile update error:', error);
        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log('Profile update successful, new user data:', data.user);
        setUser(data.user);
        return { success: true };
      }

      return { success: false, error: "Profile update failed" };
    } catch (error: any) {
      console.error("Profile update error:", error);
      return { success: false, error: error.message || "An unexpected error occurred" };
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    try {
      // First, verify the current password by attempting to sign in
      if (!user?.email) {
        return { success: false, error: "User not authenticated" };
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });

      if (signInError) {
        return { success: false, error: "Current password is incorrect" };
      }

      // If current password is correct, update to the new password
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        setUser(data.user);
        return { success: true };
      }

      return { success: false, error: "Password update failed" };
    } catch (error: any) {
      console.error("Password update error:", error);
      return { success: false, error: error.message || "An unexpected error occurred" };
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateProfile,
    updatePassword,
    isLoading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}