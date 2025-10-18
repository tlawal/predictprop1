-- CHECK RLS STATUS FOR ADDONS

-- Check current RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'addons'
ORDER BY policyname;

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'addons';

-- Test manual delete (should work if RLS is disabled or policies allow it)
-- Uncomment to test:
-- UPDATE addons SET active = false WHERE id = '69e70dcd-2fc8-45ba-896c-53ca04c2aa33' RETURNING *;
