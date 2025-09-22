import { createClient } from '@supabase/supabase-js';

// Supabase client configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database types for TypeScript support (optional)
export const Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: 'string',
          email: 'string | null',
          wallet: 'string',
          language: 'string',
          verified: 'boolean',
          created_at: 'string',
          updated_at: 'string'
        },
        Insert: {
          id: 'string?',
          email: 'string | null?',
          wallet: 'string',
          language: 'string?',
          verified: 'boolean?',
          created_at: 'string?',
          updated_at: 'string?'
        },
        Update: {
          id: 'string?',
          email: 'string | null?',
          wallet: 'string?',
          language: 'string?',
          verified: 'boolean?',
          created_at: 'string?',
          updated_at: 'string?'
        }
      },
      challenges: {
        Row: {
          id: 'string',
          user_id: 'string',
          plan_type: "'1-step' | '2-step' | 'free-trial'",
          balance: 'number',
          params: 'any',
          status: "'active' | 'passed' | 'failed'",
          created_at: 'string',
          updated_at: 'string'
        },
        Insert: {
          id: 'string?',
          user_id: 'string',
          plan_type: "'1-step' | '2-step' | 'free-trial'",
          balance: 'number?',
          params: 'any?',
          status: "'active' | 'passed' | 'failed'?",
          created_at: 'string?',
          updated_at: 'string?'
        },
        Update: {
          id: 'string?',
          user_id: 'string?',
          plan_type: "'1-step' | '2-step' | 'free-trial'?",
          balance: 'number?',
          params: 'any?',
          status: "'active' | 'passed' | 'failed'?",
          created_at: 'string?',
          updated_at: 'string?'
        }
      },
      trades: {
        Row: {
          id: 'string',
          challenge_id: 'string',
          market_id: 'string',
          side: "'Yes' | 'No'",
          amount: 'number',
          entry_price: 'number',
          pnl: 'number',
          resolved: 'boolean',
          created_at: 'string',
          updated_at: 'string'
        },
        Insert: {
          id: 'string?',
          challenge_id: 'string',
          market_id: 'string',
          side: "'Yes' | 'No'",
          amount: 'number',
          entry_price: 'number',
          pnl: 'number?',
          resolved: 'boolean?',
          created_at: 'string?',
          updated_at: 'string?'
        },
        Update: {
          id: 'string?',
          challenge_id: 'string?',
          market_id: 'string?',
          side: "'Yes' | 'No'?",
          amount: 'number?',
          entry_price: 'number?',
          pnl: 'number?',
          resolved: 'boolean?',
          created_at: 'string?',
          updated_at: 'string?'
        }
      },
      yields: {
        Row: {
          id: 'string',
          lp_id: 'string',
          amount: 'number',
          apy: 'number',
          created_at: 'string',
          updated_at: 'string'
        },
        Insert: {
          id: 'string?',
          lp_id: 'string',
          amount: 'number',
          apy: 'number',
          created_at: 'string?',
          updated_at: 'string?'
        },
        Update: {
          id: 'string?',
          lp_id: 'string?',
          amount: 'number?',
          apy: 'number?',
          created_at: 'string?',
          updated_at: 'string?'
        }
      },
      plans: {
        Row: {
          id: 'string',
          type: "'1-step' | '2-step'",
          description: 'string',
          params: 'any',
          fee: 'number',
          active: 'boolean',
          created_at: 'string',
          updated_at: 'string'
        },
        Insert: {
          id: 'string?',
          type: "'1-step' | '2-step'",
          description: 'string',
          params: 'any?',
          fee: 'number?',
          active: 'boolean?',
          created_at: 'string?',
          updated_at: 'string?'
        },
        Update: {
          id: 'string?',
          type: "'1-step' | '2-step'?",
          description: 'string?',
          params: 'any?',
          fee: 'number?',
          active: 'boolean?',
          created_at: 'string?',
          updated_at: 'string?'
        }
      }
    }
  }
};
