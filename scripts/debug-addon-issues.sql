-- DEBUG ADDON ISSUES

-- Check if the addon exists
SELECT id, name, active, created_at
FROM addons
WHERE id = '69e70dcd-2fc8-45ba-896c-53ca04c2aa33';

-- Check all addons
SELECT id, name, active, created_at
FROM addons
ORDER BY created_at DESC;

-- Check RLS policies on addons table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'addons'
ORDER BY policyname;

-- Test if we can update the addon manually
UPDATE addons
SET active = false
WHERE id = '69e70dcd-2fc8-45ba-896c-53ca04c2aa33'
RETURNING id, name, active;

-- Check if RLS is enabled on addons table
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'addons';
