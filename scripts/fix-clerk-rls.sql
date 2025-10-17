-- FIX RLS POLICIES FOR CLERK AUTHENTICATION
-- Clerk JWT tokens store user ID in 'sub' field, not auth.uid()

-- Ensure user_id_text column exists with unique constraint
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_id_text TEXT UNIQUE;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own record" ON users;
DROP POLICY IF EXISTS "Users can update their own record" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

-- Create new policies that work with Clerk JWT tokens
-- For Clerk users, we check against user_id_text column
CREATE POLICY "Users can view their own record" ON users
  FOR SELECT USING (auth.jwt() ->> 'sub' = user_id_text);

CREATE POLICY "Users can update their own record" ON users
  FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id_text);

CREATE POLICY "Enable insert for authenticated users only" ON users
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage all users" ON users
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Payments policies remain the same since user_id is a UUID reference

-- Verification
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
