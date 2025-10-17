'use client';

import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { supabase, isSupabaseConfigured } from '../supabase';
import i18n from '../i18n';

/**
 * Hook to sync Clerk authentication with Supabase
 * Automatically upserts user data when user logs in
 */
export function useSupabaseAuth() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user || !isSupabaseConfigured) {
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
        console.log('🔄 Starting user sync with Clerk user:', {
          userId: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          isSupabaseConfigured,
          supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        });

        // Check if Supabase is properly configured
        if (!isSupabaseConfigured) {
          console.warn('⚠️ Supabase not configured, skipping user sync');
          console.log('Missing env vars:', {
            url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          });
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

        // Check if user already exists by Clerk user ID
        const { data: existingUserByClerkId, error: fetchExistingError } = await supabase
          .from('users')
          .select('id')
          .eq('user_id_text', user.id)
          .single();

        const userData = {
          user_id_text: user.id, // Store Clerk user ID in TEXT column
          email: user.primaryEmailAddress?.emailAddress || null,
          wallet: null, // Clerk users don't have wallets
          language: userLanguage,
          verified: user.primaryEmailAddress?.verification?.status === 'verified' || false,
        };

        console.log('📤 Syncing user with Supabase:', userData);

        let result;
        if (existingUserByClerkId && !fetchExistingError) {
          // User exists, update their record
          console.log('🔄 Updating existing user');
          result = await supabase
            .from('users')
            .update(userData)
            .eq('user_id_text', user.id);
        } else {
          // User doesn't exist, insert new record (id will be auto-generated UUID)
          console.log('➕ Creating new user');
          result = await supabase
            .from('users')
            .insert(userData);
        }

        const { data, error } = result;

        console.log('📥 Supabase response:', { data, error });

        if (error) {
          console.error('❌ Error syncing user with Supabase:', {
            error: error || 'Unknown error',
            errorCode: error?.code,
            errorMessage: error?.message,
            errorDetails: error?.details,
            errorHint: error?.hint,
            userData,
            supabaseConfigured: isSupabaseConfigured,
            supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            supabaseUrlValue: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
            supabaseKeyValue: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...'
          });

          // If the error is about the table not existing, provide helpful guidance
          if (error?.code === '42P01') {
            console.error('💡 The users table does not exist in your Supabase database. Please run the database migrations from scripts/safe-user-id-migration.sql');
          } else if (error?.code === '42501') {
            console.error('💡 RLS policy violation. Check your Row Level Security policies for the users table.');
          } else if (error?.message?.includes('JWT')) {
            console.error('💡 Authentication issue. Check your Supabase anon key.');
          } else {
            console.error('💡 Unknown error. Check your Supabase configuration and network connection.');
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
  }, [isLoaded, isSignedIn, user]);

  return {
    isReady: isLoaded,
    isAuthenticated: isSignedIn,
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
