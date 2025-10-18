-- CHECK ACTUAL SCHEMA OF PLANS TABLE

-- Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'plans'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if table exists
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'plans'
  AND table_schema = 'public';

-- Show sample data from plans table (without size column)
SELECT id, type, fee, active, created_at, params
FROM plans
LIMIT 5;
