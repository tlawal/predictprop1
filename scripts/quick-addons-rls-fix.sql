-- QUICK FIX: Disable RLS temporarily for addons table
-- Run this in Supabase SQL Editor to allow admin operations

-- Option 1: Disable RLS completely (temporary fix)
ALTER TABLE addons DISABLE ROW LEVEL SECURITY;

-- Option 2: Or apply permissive policies (better for production)
-- ALTER TABLE addons ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Anyone can view active addons" ON addons;
-- DROP POLICY IF EXISTS "Admins can manage addons" ON addons;
-- DROP POLICY IF EXISTS "Authenticated users can view active addons" ON addons;
-- DROP POLICY IF EXISTS "Authenticated users can manage addons" ON addons;
-- CREATE POLICY "Allow all operations on addons" ON addons FOR ALL USING (true) WITH CHECK (true);
