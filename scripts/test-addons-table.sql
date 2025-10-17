-- Test creating just the addons table
-- First, check if the update_updated_at_column function exists
SELECT 'Function exists' as status WHERE EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'update_updated_at_column'
);

-- Create addons table if it doesn't exist
CREATE TABLE IF NOT EXISTS addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  param_key TEXT NOT NULL,
  param_value JSONB,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Check if table was created
SELECT 'addons table created successfully' as result, COUNT(*) as columns
FROM information_schema.columns
WHERE table_name = 'addons' AND table_schema = 'public';
