#!/usr/bin/env node

/**
 * Script to run Supabase database migrations
 * This ensures the database schema is up to date
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql');

console.log('🚀 Running Supabase database migration...');

try {
  // Check if migration file exists
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    process.exit(1);
  }

  console.log('📄 Migration file found at:', migrationPath);

  // Option 1: Try using Supabase CLI
  try {
    console.log('🔧 Attempting to run migration with Supabase CLI...');
    execSync('supabase db push', { stdio: 'inherit' });
    console.log('✅ Migration completed successfully!');
  } catch (cliError) {
    console.log('⚠️  Supabase CLI not available or failed. Please run the migration manually:');
    console.log('');
    console.log('📋 Manual Migration Steps:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of:');
    console.log('   supabase/migrations/001_initial_schema.sql');
    console.log('4. Execute the SQL');
    console.log('');
    console.log('📋 Or reset your local database:');
    console.log('   supabase db reset');
    console.log('');
    console.log('❌ CLI Error:', cliError.message);
  }

} catch (error) {
  console.error('❌ Migration script failed:', error.message);
  process.exit(1);
}
