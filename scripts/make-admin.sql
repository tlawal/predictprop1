-- MAKE LARRY.LAWAL@GMAIL.COM AN ADMIN
-- Run these commands in Supabase SQL Editor
-- Updated for Clerk + Supabase users table structure

-- Step 1: Find the user by email
SELECT id, email, user_id_text, role, created_at
FROM users
WHERE email = 'larry.lawal@gmail.com';

-- Step 2: Update the user's role to admin in the users table
UPDATE users
SET role = 'admin'
WHERE email = 'larry.lawal@gmail.com';

-- Step 3: Verify the update
SELECT id, email, user_id_text, role, created_at
FROM users
WHERE email = 'larry.lawal@gmail.com';

-- Step 4: Check that the user exists and has the admin role
SELECT
  CASE
    WHEN role = 'admin' THEN '✅ User is now an admin!'
    ELSE '❌ User role was not updated correctly'
  END as status,
  id, email, user_id_text, role
FROM users
WHERE email = 'larry.lawal@gmail.com';
