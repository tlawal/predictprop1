-- Create addons table
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

-- Add updated_at trigger
CREATE TRIGGER update_addons_updated_at BEFORE UPDATE ON addons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE addons ENABLE ROW LEVEL SECURITY;

-- RLS Policies for addons table (public read for active, admin write)
CREATE POLICY "Anyone can view active addons" ON addons
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage addons" ON addons
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
