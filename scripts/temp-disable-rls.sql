-- TEMPORARY WORKAROUND: Disable RLS for testing
-- This will allow user sync to work while we figure out proper Clerk JWT policies

-- Disable RLS on users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Insert a test user to verify it works
INSERT INTO users (user_id_text, email, language, verified)
VALUES ('test_clerk_user', 'test@clerk.com', 'en', true)
ON CONFLICT (user_id_text) DO NOTHING;

-- Check the test user was created
SELECT id, user_id_text, email, created_at FROM users WHERE user_id_text = 'test_clerk_user';
