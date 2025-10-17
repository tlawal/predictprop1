-- FIX USERS TABLE RLS POLICIES
-- Run these commands in Supabase SQL Editor

-- Step 1: Check current RLS policies on users table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- Step 2: Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can insert their own record" ON users;
DROP POLICY IF EXISTS "Users can update their own record" ON users;
DROP POLICY IF EXISTS "Users can view their own record" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON users;

-- Step 3: Create proper RLS policies for users table
CREATE POLICY "Users can view their own record" ON users
  FOR SELECT USING (auth.uid()::text = id::text OR auth.uid()::text = user_id_text);

CREATE POLICY "Users can update their own record" ON users
  FOR UPDATE USING (auth.uid()::text = id::text OR auth.uid()::text = user_id_text);

CREATE POLICY "Enable insert for authenticated users only" ON users
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Step 4: Allow admins to manage all users
CREATE POLICY "Admins can manage all users" ON users
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Step 5: Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
