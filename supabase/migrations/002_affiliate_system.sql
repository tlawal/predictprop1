-- Migration: Affiliate system overhaul
-- Description: Create affiliate, tier, commission, and settings tables with required constraints.

BEGIN;

-- Drop legacy affiliate tables if present
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS affiliates CASCADE;

-- Settings table (key/value) if not exists
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enumerations
DO $$ BEGIN
  CREATE TYPE contract_status AS ENUM ('pending', 'approved', 'rejected', 'revoked');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE commission_status AS ENUM ('pending', 'paid');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Affiliates table
CREATE TABLE affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  affiliate_id TEXT NOT NULL UNIQUE,
  custom_name TEXT,
  notes TEXT,
  name TEXT,
  email TEXT,
  phone TEXT,
  referrals_count INTEGER NOT NULL DEFAULT 0,
  current_tier INTEGER NOT NULL DEFAULT 1,
  website TEXT,
  promotion_method TEXT,
  contract_status contract_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  auto_withdraw_email TEXT,
  payout_email TEXT,
  withdrawal_delay INTEGER NOT NULL DEFAULT 7,
  withdrawal_threshold NUMERIC(12, 2) NOT NULL DEFAULT 100,
  custom_commission JSONB,
  promotion_info TEXT,
  UNIQUE(user_id)
);

CREATE INDEX affiliates_affiliate_id_idx ON affiliates(affiliate_id);
CREATE INDEX affiliates_user_id_idx ON affiliates(user_id);

-- Affiliate tiers table
CREATE TABLE affiliate_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 4),
  referral_threshold INTEGER NOT NULL CHECK (referral_threshold >= 0),
  payout_percent NUMERIC(5,2) NOT NULL CHECK (payout_percent >= 0),
  direct_passup NUMERIC(5,2) NOT NULL CHECK (direct_passup >= 0),
  indirect_passup NUMERIC(5,2) NOT NULL CHECK (indirect_passup >= 0),
  UNIQUE(level)
);

-- Affiliate commissions table
CREATE TABLE affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  order_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  status commission_status NOT NULL DEFAULT 'pending',
  manual BOOLEAN NOT NULL DEFAULT FALSE,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX affiliate_commissions_affiliate_idx ON affiliate_commissions(affiliate_id);
CREATE INDEX affiliate_commissions_status_idx ON affiliate_commissions(status);

-- Affiliate referrals mapping table (multi-level)
CREATE TABLE affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 4),
  commission_id UUID REFERENCES affiliate_commissions(id) ON DELETE SET NULL,
  amount NUMERIC(12,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(affiliate_id, referred_user_id, level)
);

CREATE INDEX affiliate_referrals_referred_idx ON affiliate_referrals(referred_user_id);
CREATE INDEX affiliate_referrals_order_idx ON affiliate_referrals(order_id);

-- Settings defaults
INSERT INTO settings (key, value)
VALUES
  ('auto_approve_affiliates', jsonb_build_object('enabled', false)),
  ('auto_create_contract', jsonb_build_object('enabled', false))
ON CONFLICT (key) DO NOTHING;

-- Default tiers
INSERT INTO affiliate_tiers (level, referral_threshold, payout_percent, direct_passup, indirect_passup)
VALUES
  (1, 0, 10.00, 0.00, 0.00),
  (2, 5, 12.50, 2.50, 1.00),
  (3, 15, 15.00, 3.00, 1.50),
  (4, 30, 18.00, 4.00, 2.00)
ON CONFLICT (level) DO NOTHING;

-- RLS policies
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Grant access to service role
GRANT ALL ON affiliates TO service_role;
GRANT ALL ON affiliate_tiers TO service_role;
GRANT ALL ON affiliate_commissions TO service_role;
GRANT ALL ON affiliate_referrals TO service_role;
GRANT ALL ON settings TO service_role;

GRANT USAGE ON TYPE contract_status TO service_role;
GRANT USAGE ON TYPE commission_status TO service_role;

COMMIT;
