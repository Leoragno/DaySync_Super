import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '@/api/supabase';
import { dataCache } from '@/api/cache';
import { queryClient } from '@/lib/queryClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize: check existing session
  useEffect(() => {
    let mounted = true;

    async function init() {
      if (!supabase) {
        if (mounted) {
          setError('Configurazione Supabase mancante (.env)');
          setIsLoading(false);
        }
        return;
      }
      try {
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message);
          setIsLoading(false);
        }
      }
    }

    init();

    // Listen for auth state changes (login, logout, token refresh)
    const subscription = supabase?.auth.onAuthStateChange(
      (_event, newSession) => {
        if (mounted) {
          setSession(newSession);
          setUser(newSession?.user ?? null);
          setIsLoading(false);
          setError(null);
        }
      }
    )?.data.subscription;

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email, password,
    });
    setIsLoading(false);
    if (signInError) {
      setError(signInError.message);
      throw signInError;
    }
    return data;
  }, []);

  const signUp = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email, password,
    });
    setIsLoading(false);
    if (signUpError) {
      setError(signUpError.message);
      throw signUpError;
    }
    return data;
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        setError(signOutError.message);
        throw signOutError;
      }
    } finally {
      // Always clear cache on logout, even if signOut fails
      await dataCache.clearAll();
      setUser(null);
      setSession(null);
      // Clear React Query cache as well
      queryClient.clear();
    }
  }, []);

  const value = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    error,
    signIn,
    signUp,
    signOut,
    clearError: () => setError(null),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
