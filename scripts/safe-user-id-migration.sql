-- Safe migration: Add new user_id_text column for Privy DIDs
-- This preserves existing UUID id column and adds TEXT column for Privy compatibility
-- Can be run multiple times safely - uses IF NOT EXISTS and DROP IF EXISTS

-- Add new user_id_text column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_id_text TEXT UNIQUE;

-- Add billing_info column if missing
ALTER TABLE users ADD COLUMN IF NOT EXISTS billing_info JSONB;

-- Create missing tables with proper references
-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_payment_intent_id TEXT,
  user_id TEXT NOT NULL, -- Will reference user_id_text
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  type TEXT NOT NULL CHECK (type IN ('evaluation', 'addon', 'subscription')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payouts table
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- Will reference user_id_text
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  method TEXT NOT NULL CHECK (method IN ('stripe', 'usdc', 'bank_transfer')),
  stripe_payout_id TEXT,
  transaction_hash TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create addons table
CREATE TABLE IF NOT EXISTS addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  param_key TEXT NOT NULL,
  param_value JSONB,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE addons ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (drop existing ones first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
DROP POLICY IF EXISTS "Admins can update payments" ON payments;
DROP POLICY IF EXISTS "Users can view their own payouts" ON payouts;
DROP POLICY IF EXISTS "Admins can manage all payouts" ON payouts;
DROP POLICY IF EXISTS "Anyone can view active addons" ON addons;
DROP POLICY IF EXISTS "Admins can manage addons" ON addons;

CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Admins can view all payments" ON payments
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update payments" ON payments
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can view their own payouts" ON payouts
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Admins can manage all payouts" ON payouts
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Anyone can view active addons" ON addons
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage addons" ON addons
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Add triggers (drop existing ones first)
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
DROP TRIGGER IF EXISTS update_payouts_updated_at ON payouts;
DROP TRIGGER IF EXISTS update_addons_updated_at ON addons;

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON payouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addons_updated_at BEFORE UPDATE ON addons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample addons (safe insertion - uses unique constraint on name)
INSERT INTO addons (name, description, price, param_key, param_value) VALUES
  ('90/10 Profit Split', 'Increase your profit share to 90% with platform taking 10%', 5.00, 'profit_split', '{"trader": 90, "platform": 10}'),
  ('50% Drawdown Reset', 'Reset your drawdown limit to 50% of account balance', 10.00, 'drawdown_reset', '{"max_drawdown": 50}')
ON CONFLICT (name) DO NOTHING;

-- Verification
SELECT 'Migration completed successfully' as status;
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('payments', 'payouts', 'addons')
ORDER BY table_name;
