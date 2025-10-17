-- Add billing_info column to users table
-- Run this in Supabase SQL Editor if the column is missing

ALTER TABLE users ADD COLUMN IF NOT EXISTS billing_info JSONB;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'billing_info';
