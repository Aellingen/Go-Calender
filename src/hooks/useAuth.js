import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

async function fetchSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const res = await fetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!res.ok) {
    if (res.status === 401) return null;
    throw new Error('Session check failed');
  }
  return res.json();
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: fetchSession,
    retry: false,
    staleTime: 5 * 60_000,
  });

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'session'] });
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    queryClient.invalidateQueries({ queryKey: ['auth', 'session'] });
  }, [queryClient]);

  return {
    user: data?.data ?? null,
    isAuthenticated: !!data?.data,
    isLoading,
    error,
    signOut,
  };
}

/** Helper to get the current access token for API calls */
export async function getAccessToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}
