'use client';

import { useSupabaseAuth } from '../../lib/hooks/useSupabaseAuth';

/**
 * Provider component that handles Supabase user synchronization with Privy
 * This runs automatically whenever a user logs in or out
 */
export function SupabaseAuthProvider({ children }) {
  // This hook handles the automatic sync between Privy and Supabase
  useSupabaseAuth();

  // The component doesn't render anything special, just passes through children
  return children;
}
