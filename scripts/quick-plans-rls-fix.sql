-- QUICK FIX: Disable RLS temporarily for plans table
-- Run this in Supabase SQL Editor to allow admin operations

-- Option 1: Disable RLS completely (temporary fix)
ALTER TABLE plans DISABLE ROW LEVEL SECURITY;

-- Option 2: Or apply permissive policies (better for production)
-- ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Anyone can view plans" ON plans;
-- DROP POLICY IF EXISTS "Admins can manage plans" ON plans;
-- DROP POLICY IF EXISTS "Authenticated users can view plans" ON plans;
-- DROP POLICY IF EXISTS "Authenticated users can manage plans" ON plans;
-- CREATE POLICY "Allow all operations on plans" ON plans FOR ALL USING (true) WITH CHECK (true);
