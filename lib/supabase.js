import { createClient } from '@supabase/supabase-js';

// Supabase client configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create Supabase client only if environment variables are available
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null;

// Export a flag to check if Supabase is configured
export const isSupabaseConfigured = !!supabase;

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
          role: "'user' | 'admin' | 'affiliate'",
          created_at: 'string',
          updated_at: 'string'
        },
        Insert: {
          id: 'string?',
          email: 'string | null?',
          wallet: 'string',
          language: 'string?',
          verified: 'boolean?',
          role: "'user' | 'admin' | 'affiliate'?",
          created_at: 'string?',
          updated_at: 'string?'
        },
        Update: {
          id: 'string?',
          email: 'string | null?',
          wallet: 'string?',
          language: 'string?',
          verified: 'boolean?',
          role: "'user' | 'admin' | 'affiliate'?",
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
      orders: {
        Row: {
          id: 'string',
          order_id: 'string',
          plan_id: 'string',
          user_id: 'string',
          addons: 'any',
          amount: 'number',
          affiliate_id: 'string | null',
          status: "'pending' | 'completed' | 'cancelled' | 'refunded'",
          payment_method: "'stripe' | 'crypto' | 'bank_transfer' | null",
          notes: 'string | null',
          created_at: 'string',
          updated_at: 'string'
        },
        Insert: {
          id: 'string?',
          order_id: 'string',
          plan_id: 'string',
          user_id: 'string',
          addons: 'any?',
          amount: 'number',
          affiliate_id: 'string | null?',
          status: "'pending' | 'completed' | 'cancelled' | 'refunded'?",
          payment_method: "'stripe' | 'crypto' | 'bank_transfer' | null?",
          notes: 'string | null?',
          created_at: 'string?',
          updated_at: 'string?'
        },
        Update: {
          id: 'string?',
          order_id: 'string?',
          plan_id: 'string?',
          user_id: 'string?',
          addons: 'any?',
          amount: 'number?',
          affiliate_id: 'string | null?',
          status: "'pending' | 'completed' | 'cancelled' | 'refunded'?",
          payment_method: "'stripe' | 'crypto' | 'bank_transfer' | null?",
          notes: 'string | null?',
          created_at: 'string?',
          updated_at: 'string?'
        }
      },
      payments: {
        Row: {
          id: 'string',
          user_id: 'string',
          plan_id: 'string | null',
          challenge_id: 'string | null',
          stripe_payment_intent_id: 'string | null',
          amount: 'number',
          currency: 'string',
          status: "'pending' | 'completed' | 'failed' | 'refunded'",
          type: "'evaluation_fee' | 'subscription' | 'addon'",
          metadata: 'any',
          completed_at: 'string | null',
          failed_at: 'string | null',
          error_message: 'string | null',
          created_at: 'string',
          updated_at: 'string'
        },
        Insert: {
          id: 'string?',
          user_id: 'string',
          plan_id: 'string | null?',
          challenge_id: 'string | null?',
          stripe_payment_intent_id: 'string | null?',
          amount: 'number',
          currency: 'string?',
          status: "'pending' | 'completed' | 'failed' | 'refunded'?",
          type: "'evaluation_fee' | 'subscription' | 'addon'?",
          metadata: 'any?',
          completed_at: 'string | null?',
          failed_at: 'string | null?',
          error_message: 'string | null?',
          created_at: 'string?',
          updated_at: 'string?'
        },
        Update: {
          id: 'string?',
          user_id: 'string?',
          plan_id: 'string | null?',
          challenge_id: 'string | null?',
          stripe_payment_intent_id: 'string | null?',
          amount: 'number?',
          currency: 'string?',
          status: "'pending' | 'completed' | 'failed' | 'refunded'?",
          type: "'evaluation_fee' | 'subscription' | 'addon'?",
          metadata: 'any?',
          completed_at: 'string | null?',
          failed_at: 'string | null?',
          error_message: 'string | null?',
          created_at: 'string?',
          updated_at: 'string?'
        }
      },
      payouts: {
        Row: {
          id: 'string',
          user_id: 'string',
          challenge_id: 'string',
          amount: 'number',
          method: "'stripe' | 'usdc' | 'bank_transfer'",
          status: "'pending' | 'processing' | 'completed' | 'failed'",
          stripe_payout_id: 'string | null',
          transaction_hash: 'string | null',
          requested_at: 'string',
          processed_at: 'string | null',
          completed_at: 'string | null',
          failed_at: 'string | null',
          error_message: 'string | null',
          created_at: 'string',
          updated_at: 'string'
        },
        Insert: {
          id: 'string?',
          user_id: 'string',
          challenge_id: 'string',
          amount: 'number',
          method: "'stripe' | 'usdc' | 'bank_transfer'",
          status: "'pending' | 'processing' | 'completed' | 'failed'?",
          stripe_payout_id: 'string | null?',
          transaction_hash: 'string | null?',
          requested_at: 'string?',
          processed_at: 'string | null?',
          completed_at: 'string | null?',
          failed_at: 'string | null?',
          error_message: 'string | null?',
          created_at: 'string?',
          updated_at: 'string?'
        },
        Update: {
          id: 'string?',
          user_id: 'string?',
          challenge_id: 'string?',
          amount: 'number?',
          method: "'stripe' | 'usdc' | 'bank_transfer'?",
          status: "'pending' | 'processing' | 'completed' | 'failed'?",
          stripe_payout_id: 'string | null?',
          transaction_hash: 'string | null?',
          requested_at: 'string?',
          processed_at: 'string | null?',
          completed_at: 'string | null?',
          failed_at: 'string | null?',
          error_message: 'string | null?',
          created_at: 'string?',
          updated_at: 'string?'
        }
      },
      contracts: {
        Row: {
          id: 'string',
          user_id: 'string',
          type: "'terms_of_service' | 'privacy_policy' | 'trading_agreement'",
          version: 'string',
          content: 'string',
          status: "'pending' | 'signed' | 'rejected'",
          signed_at: 'string | null',
          signed_ip: 'string | null',
          signed_user_agent: 'string | null',
          verification_code: 'string | null',
          code_expires_at: 'string | null',
          created_at: 'string',
          updated_at: 'string'
        },
        Insert: {
          id: 'string?',
          user_id: 'string',
          type: "'terms_of_service' | 'privacy_policy' | 'trading_agreement'",
          version: 'string',
          content: 'string',
          status: "'pending' | 'signed' | 'rejected'?",
          signed_at: 'string | null?',
          signed_ip: 'string | null?',
          signed_user_agent: 'string | null?',
          verification_code: 'string | null?',
          code_expires_at: 'string | null?',
          created_at: 'string?',
          updated_at: 'string?'
        },
        Update: {
          id: 'string?',
          user_id: 'string?',
          type: "'terms_of_service' | 'privacy_policy' | 'trading_agreement'?",
          version: 'string?',
          content: 'string?',
          status: "'pending' | 'signed' | 'rejected'?",
          signed_at: 'string | null?',
          signed_ip: 'string | null?',
          signed_user_agent: 'string | null?',
          verification_code: 'string | null?',
          code_expires_at: 'string | null?',
          created_at: 'string?',
          updated_at: 'string?'
        }
      },
      admin_logs: {
        Row: {
          id: 'string',
          admin_id: 'string',
          action: 'string',
          entity_type: 'string',
          entity_id: 'string',
          old_values: 'any | null',
          new_values: 'any | null',
          ip_address: 'string | null',
          user_agent: 'string | null',
          notes: 'string | null',
          created_at: 'string'
        },
        Insert: {
          id: 'string?',
          admin_id: 'string',
          action: 'string',
          entity_type: 'string',
          entity_id: 'string',
          old_values: 'any | null?',
          new_values: 'any | null?',
          ip_address: 'string | null?',
          user_agent: 'string | null?',
          notes: 'string | null?',
          created_at: 'string?'
        },
        Update: {
          id: 'string?',
          admin_id: 'string?',
          action: 'string?',
          entity_type: 'string?',
          entity_id: 'string?',
          old_values: 'any | null?',
          new_values: 'any | null?',
          ip_address: 'string | null?',
          user_agent: 'string | null?',
          notes: 'string | null?',
          created_at: 'string?'
        }
      },
      plans: {
        Row: {
          id: 'string',
          type: "'1-step' | '2-step'",
          size: 'number',
          fee: 'number',
          params: 'any',
          active: 'boolean',
          created_at: 'string',
          updated_at: 'string'
        },
        Insert: {
          id: 'string?',
          type: "'1-step' | '2-step'",
          size: 'number?',
          fee: 'number?',
          params: 'any?',
          active: 'boolean?',
          created_at: 'string?',
          updated_at: 'string?'
        },
        Update: {
          id: 'string?',
          type: "'1-step' | '2-step'?",
          size: 'number?',
          fee: 'number?',
          params: 'any?',
          active: 'boolean?',
          created_at: 'string?',
          updated_at: 'string?'
        }
      },
      addons: {
        Row: {
          id: 'string',
          name: 'string',
          description: 'string',
          price: 'number',
          param_key: 'string',
          param_value: 'any',
          active: 'boolean',
          created_at: 'string',
          updated_at: 'string'
        },
        Insert: {
          id: 'string?',
          name: 'string',
          description: 'string',
          price: 'number?',
          param_key: 'string',
          param_value: 'any?',
          active: 'boolean?',
          created_at: 'string?',
          updated_at: 'string?'
        },
        Update: {
          id: 'string?',
          name: 'string?',
          description: 'string?',
          price: 'number?',
          param_key: 'string?',
          param_value: 'any?',
          active: 'boolean?',
          created_at: 'string?',
          updated_at: 'string?'
        }
      }
    }
  }
};
