BEGIN;

ALTER TABLE affiliates
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE affiliates
  ADD COLUMN IF NOT EXISTS custom_url TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS affiliates_custom_url_idx ON affiliates(custom_url);

DROP TRIGGER IF EXISTS update_affiliates_updated_at ON affiliates;

CREATE TRIGGER update_affiliates_updated_at
  BEFORE UPDATE ON affiliates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMIT;
