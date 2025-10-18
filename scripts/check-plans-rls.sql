-- CHECK RLS STATUS FOR PLANS TABLE

-- Check current RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'plans'
ORDER BY policyname;

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'plans';

-- Show current plans data
SELECT id, type, size, fee, active, created_at
FROM plans
ORDER BY created_at DESC;
