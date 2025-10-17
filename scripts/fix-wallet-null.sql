-- FIX WALLET COLUMN TO ALLOW NULL VALUES FOR CLERK USERS
-- Clerk users don't have wallets, so wallet should be nullable

-- Make wallet column nullable
ALTER TABLE users ALTER COLUMN wallet DROP NOT NULL;

-- Update the wallet field for existing users to empty string if null
UPDATE users SET wallet = '' WHERE wallet IS NULL;

-- Verify the change
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'wallet';
