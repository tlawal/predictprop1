BEGIN;

ALTER TABLE affiliates
  ADD COLUMN IF NOT EXISTS custom_url TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS affiliates_custom_url_idx ON affiliates(custom_url);

COMMIT;
