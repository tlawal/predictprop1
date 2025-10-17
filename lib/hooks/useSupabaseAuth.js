'use client';

import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { supabase, isSupabaseConfigured } from '../supabase';
import i18n from '../i18n';

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
        // Load language from localStorage if available
        const savedLanguage = localStorage.getItem('preferredLanguage');
        if (savedLanguage && i18n.language !== savedLanguage) {
          i18n.changeLanguage(savedLanguage);
        }
      }
      return;
    }

    const syncUser = async () => {
      try {
        // Check if Supabase is properly configured
        if (!isSupabaseConfigured) {
          console.log('Supabase not configured, skipping user sync');
          return;
        }

        // First, try to get existing user data to preserve language preference
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('language')
          .eq('id', user.id)
          .single();

        // If the table doesn't exist, fetchError will be present
        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found" for single()
          console.warn('Could not fetch existing user data:', fetchError);
        }

        const userLanguage = existingUser?.language || localStorage.getItem('preferredLanguage') || 'en';

        const userData = {
          id: user.id,
          email: user.email?.address || null,
          wallet: user.wallet?.address || '',
          language: userLanguage,
          verified: user.email?.verified || false,
        };

        console.log('Syncing user with Supabase:', userData);

        const { data, error } = await supabase
          .from('users')
          .upsert(userData, {
            onConflict: 'id'
          });

        if (error) {
          console.error('Error syncing user with Supabase:', {
            error,
            errorCode: error.code,
            errorMessage: error.message,
            errorDetails: error.details,
            userData,
            supabaseConfigured: isSupabaseConfigured,
            supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          });

          // If the error is about the table not existing, provide helpful guidance
          if (error.code === '42P01') {
            console.error('The users table does not exist in your Supabase database. Please run the database migrations.');
          }
        } else {
          console.log('User synced successfully with Supabase');
          // Set the user's preferred language in i18next
          if (userLanguage && i18n.language !== userLanguage) {
            await i18n.changeLanguage(userLanguage);
          }
        }
      } catch (error) {
        console.error('Failed to sync user with Supabase:', {
          error,
          errorMessage: error.message,
          errorStack: error.stack,
          supabaseConfigured: isSupabaseConfigured
        });
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
