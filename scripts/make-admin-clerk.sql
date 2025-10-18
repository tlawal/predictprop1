-- MAKE USER ADMIN IN CLERK (Required for admin access)
-- This updates Clerk's user metadata to grant admin role

-- Note: This cannot be done via SQL. You must use the Clerk Dashboard or API.

-- INSTRUCTIONS:
-- 1. Go to https://clerk.com and sign into your dashboard
-- 2. Navigate to "Users" in the left sidebar
-- 3. Find your user (search by email: larry.lawal@gmail.com)
-- 4. Click on your user record
-- 5. Go to the "Metadata" tab
-- 6. In "Public Metadata", add:
--    {
--      "role": "admin"
--    }
-- 7. Save the changes
-- 8. Refresh your browser and try accessing /admin again

-- ALTERNATIVE: If you have access to Clerk's API, you can update via API:
-- POST https://api.clerk.com/v1/users/{user_id}/metadata
-- Authorization: Bearer {secret_key}
-- Body: {"public_metadata": {"role": "admin"}}

-- VERIFY: After updating, your user metadata should show:
-- publicMetadata: { role: "admin" }
