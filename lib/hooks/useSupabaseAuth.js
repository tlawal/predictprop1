'use client';

import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { supabase, isSupabaseConfigured } from '../supabase';

/**
 * Hook to sync Privy authentication with Supabase
 * Automatically upserts user data when user logs in
 */
export function useSupabaseAuth() {
  const { ready, authenticated, user } = usePrivy();

  useEffect(() => {
    if (!ready || !authenticated || !user || !isSupabaseConfigured) {
      // Skip syncing if Supabase is not configured
      if (!isSupabaseConfigured) {
        console.log('Supabase not configured, skipping user sync');
      }
      return;
    }

    const syncUser = async () => {
      try {
        const userData = {
          id: user.id,
          email: user.email?.address || null,
          wallet: user.wallet?.address || '',
          language: 'en', // Default language
          verified: user.email?.verified || false,
        };

        console.log('Syncing user with Supabase:', userData);

        const { data, error } = await supabase
          .from('users')
          .upsert(userData, {
            onConflict: 'id',
            returning: 'minimal'
          });

        if (error) {
          console.error('Error syncing user with Supabase:', error);
        } else {
          console.log('User synced successfully with Supabase');
        }
      } catch (error) {
        console.error('Failed to sync user with Supabase:', error);
      }
    };

    syncUser();
  }, [ready, authenticated, user]);

  return {
    isReady: ready,
    isAuthenticated: authenticated,
    user,
  };
}

/**
 * Hook to get current user's challenges
 */
export function useUserChallenges(userId) {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const fetchChallenges = async () => {
      try {
        const { data, error } = await supabase
          .from('challenges')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching challenges:', error);
        } else {
          setChallenges(data || []);
        }
      } catch (error) {
        console.error('Failed to fetch challenges:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
  }, [userId]);

  return { challenges, loading };
}

/**
 * Hook to get trades for a challenge
 */
export function useChallengeTrades(challengeId) {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!challengeId || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const fetchTrades = async () => {
      try {
        const { data, error } = await supabase
          .from('trades')
          .select('*')
          .eq('challenge_id', challengeId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching trades:', error);
        } else {
          setTrades(data || []);
        }
      } catch (error) {
        console.error('Failed to fetch trades:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrades();
  }, [challengeId]);

  return { trades, loading };
}
