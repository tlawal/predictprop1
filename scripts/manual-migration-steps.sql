-- MANUAL MIGRATION STEPS
-- Run these commands ONE BY ONE in Supabase SQL Editor
-- Stop if any command fails and report the error

-- Step 1: Add user_id_text column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_id_text TEXT UNIQUE;

-- Step 2: Add billing_info column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS billing_info JSONB;

-- Step 3: Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_payment_intent_id TEXT,
  user_id TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  type TEXT NOT NULL CHECK (type IN ('evaluation', 'addon', 'subscription')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create payouts table
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
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

-- Step 5: Create addons table
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

-- Step 6: Enable RLS on all tables
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE addons ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies for payments (drop existing first)
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
DROP POLICY IF EXISTS "Admins can update payments" ON payments;

CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Admins can view all payments" ON payments
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update payments" ON payments
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- Step 8: Create RLS policies for payouts (drop existing first)
DROP POLICY IF EXISTS "Users can view their own payouts" ON payouts;
DROP POLICY IF EXISTS "Admins can manage all payouts" ON payouts;

CREATE POLICY "Users can view their own payouts" ON payouts
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Admins can manage all payouts" ON payouts
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Step 9: Create RLS policies for addons (drop existing first)
DROP POLICY IF EXISTS "Anyone can view active addons" ON addons;
DROP POLICY IF EXISTS "Admins can manage addons" ON addons;

CREATE POLICY "Anyone can view active addons" ON addons
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage addons" ON addons
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Step 10: Create update triggers (drop existing first)
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
DROP TRIGGER IF EXISTS update_payouts_updated_at ON payouts;
DROP TRIGGER IF EXISTS update_addons_updated_at ON addons;

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON payouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addons_updated_at BEFORE UPDATE ON addons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 11: Insert sample addons
INSERT INTO addons (name, description, price, param_key, param_value) VALUES
  ('90/10 Profit Split', 'Increase your profit share to 90% with platform taking 10%', 5.00, 'profit_split', '{"trader": 90, "platform": 10}'),
  ('50% Drawdown Reset', 'Reset your drawdown limit to 50% of account balance', 10.00, 'drawdown_reset', '{"max_drawdown": 50}');

-- Step 12: Verify everything worked
SELECT 'Migration completed successfully' as status;

-- Check what tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check users table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;
