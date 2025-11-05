BEGIN;

DROP POLICY IF EXISTS affiliates_user_read_self ON affiliates;

ALTER TABLE affiliates
  DROP CONSTRAINT IF EXISTS affiliates_user_id_fkey;

ALTER TABLE affiliates
  ALTER COLUMN user_id TYPE TEXT USING user_id::text;

CREATE INDEX IF NOT EXISTS affiliates_user_id_idx ON affiliates(user_id);

CREATE POLICY affiliates_user_read_self ON affiliates
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

COMMIT;
