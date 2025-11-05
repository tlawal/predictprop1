BEGIN;

DO $$
BEGIN
  CREATE TYPE affiliate_payout_status AS ENUM ('pending', 'approved', 'processing', 'paid', 'rejected', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END$$;

CREATE TABLE IF NOT EXISTS affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  requested_by_user_id TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  method TEXT,
  status affiliate_payout_status NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by TEXT,
  notes TEXT,
  admin_notes TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS affiliate_payouts_affiliate_idx ON affiliate_payouts(affiliate_id);
CREATE INDEX IF NOT EXISTS affiliate_payouts_status_idx ON affiliate_payouts(status);
CREATE INDEX IF NOT EXISTS affiliate_payouts_requested_at_idx ON affiliate_payouts(requested_at DESC);

CREATE TRIGGER affiliate_payouts_updated_at
  BEFORE UPDATE ON affiliate_payouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Basic RLS setup: affiliates can see their own payouts, admins via service role.
ALTER TABLE affiliate_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY affiliate_payouts_affiliate_read_self
  ON affiliate_payouts
  FOR SELECT
  USING (
    auth.uid()::text = requested_by_user_id::text
  );

GRANT ALL ON affiliate_payouts TO service_role;
GRANT USAGE ON TYPE affiliate_payout_status TO service_role;

COMMIT;
