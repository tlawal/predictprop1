-- ADD MISSING SIZE COLUMN TO PLANS TABLE

-- Add the size column that was missing from the plans table
ALTER TABLE plans ADD COLUMN IF NOT EXISTS size INTEGER;

-- Update existing plans to have default sizes based on their type
-- You may need to adjust these values based on your actual plan data
UPDATE plans SET size = 10000 WHERE type = '1-step' AND size IS NULL;
UPDATE plans SET size = 5000 WHERE type = '2-step' AND size IS NULL;

-- Make sure the column has a default for future inserts
ALTER TABLE plans ALTER COLUMN size SET NOT NULL;

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_plans_size ON plans(size);

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'plans'
  AND table_schema = 'public'
  AND column_name = 'size';

-- Show updated plans data
SELECT id, type, size, fee, active, created_at
FROM plans
ORDER BY created_at DESC;
