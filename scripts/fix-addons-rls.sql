-- FIX ADDONS RLS POLICIES FOR ADMIN OPERATIONS
-- Temporarily disable RLS to test if that's blocking admin operations

-- Disable RLS temporarily
ALTER TABLE addons DISABLE ROW LEVEL SECURITY;

-- Re-enable with permissive policies
ALTER TABLE addons ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view active addons" ON addons;
DROP POLICY IF EXISTS "Admins can manage addons" ON addons;

-- Create new policies that allow authenticated users to manage addons
-- (Since Clerk handles auth client-side, we'll be permissive for now)
CREATE POLICY "Authenticated users can view active addons" ON addons
  FOR SELECT USING (auth.role() = 'authenticated' OR active = true);

CREATE POLICY "Authenticated users can manage addons" ON addons
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Alternative: Completely permissive (not recommended for production)
-- CREATE POLICY "Allow all operations on addons" ON addons
--   FOR ALL USING (true)
--   WITH CHECK (true);
