// Debug script to check Supabase configuration
// Run with: node debug-supabase.js

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Checking Supabase Configuration...\n');

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('❌ Missing environment variables:');
  console.log(`NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
  console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}`);
  process.exit(1);
}

console.log('✅ Environment variables found');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
  try {
    console.log('\n📋 Checking tables...');

    // Check if users table exists
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });

    if (usersError) {
      console.log('❌ Users table error:', usersError.message);
      if (usersError.code === '42P01') {
        console.log('💡 Solution: Run the database migrations from scripts/safe-user-id-migration.sql');
      }
    } else {
      console.log('✅ Users table exists');
    }

    // List all tables
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .neq('table_name', 'schema_migrations');

    if (tablesError) {
      console.log('❌ Could not list tables:', tablesError.message);
    } else {
      console.log('📋 Available tables:', tables?.map(t => t.table_name).join(', ') || 'none');
    }

  } catch (error) {
    console.log('❌ Connection error:', error.message);
  }
}

checkTables();
