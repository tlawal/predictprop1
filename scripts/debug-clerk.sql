-- DEBUG CLERK AUTHENTICATION
-- Check what's in the JWT token and fix policies

-- First, temporarily disable RLS to test if that's the issue
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Try to insert a test user (this should work now)
INSERT INTO users (user_id_text, email, language, verified)
VALUES ('test_user_123', 'test@example.com', 'en', true)
ON CONFLICT (user_id_text) DO NOTHING;

-- Check what was inserted
SELECT id, user_id_text, email, created_at FROM users WHERE user_id_text = 'test_user_123';

-- Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create a very permissive policy for testing
DROP POLICY IF EXISTS "Allow all operations for testing" ON users;
CREATE POLICY "Allow all operations for testing" ON users
  FOR ALL USING (true) WITH CHECK (true);

-- Test the policy by checking what auth.jwt() contains
-- (You'll need to run this from your app with a real JWT)
SELECT auth.jwt() as jwt_contents;
