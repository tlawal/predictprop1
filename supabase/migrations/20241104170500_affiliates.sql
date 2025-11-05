BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS affiliate_referrals CASCADE;
DROP TABLE IF EXISTS affiliate_commissions CASCADE;
DROP TABLE IF EXISTS affiliate_tiers CASCADE;
DROP TABLE IF EXISTS affiliates CASCADE;
DROP TABLE IF EXISTS tiers CASCADE;
DROP TABLE IF EXISTS commissions CASCADE;
DROP TABLE IF EXISTS settings CASCADE;

CREATE TABLE affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  affiliate_id TEXT NOT NULL UNIQUE DEFAULT ('aff-' || uuid_generate_v4()),
  custom_name TEXT,
  notes TEXT,
  name TEXT,
  email TEXT,
  phone TEXT,
  referrals_count INTEGER NOT NULL DEFAULT 0,
  current_tier INTEGER NOT NULL DEFAULT 1,
  website TEXT,
  promotion_method TEXT,
  contract_status TEXT NOT NULL DEFAULT 'pending' CHECK (contract_status IN ('pending', 'approved', 'rejected', 'revoked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'America/New_York'),
  approved_at TIMESTAMPTZ,
  UNIQUE (user_id)
);

CREATE INDEX affiliates_user_id_idx ON affiliates(user_id);
CREATE INDEX affiliates_current_tier_idx ON affiliates(current_tier);

CREATE TABLE tiers (
  id SERIAL PRIMARY KEY,
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 4),
  referral_threshold INTEGER NOT NULL,
  payout_percent NUMERIC(6,2) NOT NULL,
  direct_passup NUMERIC(6,2) NOT NULL,
  indirect_passup NUMERIC(6,2) NOT NULL,
  UNIQUE (level)
);

INSERT INTO tiers (level, referral_threshold, payout_percent, direct_passup, indirect_passup) VALUES
  (1, 0, 5, 0, 0),
  (2, 10, 10, 5, 2),
  (3, 50, 15, 10, 5),
  (4, 100, 20, 15, 10)
ON CONFLICT (level) DO NOTHING;

CREATE TABLE commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  order_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'earned', 'paid')),
  manual BOOLEAN NOT NULL DEFAULT FALSE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'America/New_York')
);

CREATE INDEX commissions_affiliate_id_idx ON commissions(affiliate_id);
CREATE INDEX commissions_status_idx ON commissions(status);

CREATE TABLE affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  commission_id UUID REFERENCES commissions(id) ON DELETE SET NULL,
  level INTEGER NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 4),
  amount NUMERIC(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'America/New_York'),
  UNIQUE (affiliate_id, referred_user_id, level)
);

CREATE INDEX affiliate_referrals_affiliate_idx ON affiliate_referrals(affiliate_id);
CREATE INDEX affiliate_referrals_referred_idx ON affiliate_referrals(referred_user_id);
CREATE INDEX affiliate_referrals_order_idx ON affiliate_referrals(order_id);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'America/New_York'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'America/New_York')
);

INSERT INTO settings (key, value) VALUES
  ('auto_approve_affiliates', 'false'::jsonb),
  ('auto_create_contract', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS referrer_id UUID REFERENCES users(id);

ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY affiliates_admin_all ON affiliates
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY affiliates_user_read_self ON affiliates
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY tiers_admin_all ON tiers
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY commissions_admin_all ON commissions
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY affiliate_referrals_admin_all ON affiliate_referrals
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY settings_admin_all ON settings
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

COMMIT;
