-- Create addons table manually
-- Run this in Supabase SQL Editor

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

-- Enable Row Level Security
ALTER TABLE addons ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active addons" ON addons
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage addons" ON addons
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Verify table creation
SELECT 'Addons table created successfully' as status;
