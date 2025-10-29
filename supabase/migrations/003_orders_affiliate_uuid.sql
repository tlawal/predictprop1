BEGIN;

DROP POLICY IF EXISTS "Affiliates can view orders they referred" ON orders;

DROP INDEX IF EXISTS idx_orders_affiliate_id;

ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_affiliate_id_fkey;

ALTER TABLE orders
  DROP COLUMN IF EXISTS affiliate_id;

ALTER TABLE orders
  ADD COLUMN affiliate_id UUID REFERENCES affiliates(id);

CREATE INDEX IF NOT EXISTS idx_orders_affiliate_id ON orders(affiliate_id);

COMMIT;
