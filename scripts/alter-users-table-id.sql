-- Alter users table to change id column from UUID to TEXT
-- This is needed because Privy uses DIDs as user IDs

-- First, drop RLS policies that reference the id column
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- Drop all foreign key constraints that reference users(id) - only for existing tables
ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_user_id_fkey;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_affiliate_id_fkey;
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_user_id_fkey;
ALTER TABLE admin_logs DROP CONSTRAINT IF EXISTS admin_logs_admin_id_fkey;

-- Only drop affiliates constraints if the table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'affiliates') THEN
        ALTER TABLE affiliates DROP CONSTRAINT IF EXISTS affiliates_user_id_fkey;
    END IF;
END $$;

-- Only drop referrals constraints if the table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referrals') THEN
        ALTER TABLE referrals DROP CONSTRAINT IF EXISTS referrals_referrer_id_fkey;
        ALTER TABLE referrals DROP CONSTRAINT IF EXISTS referrals_referred_user_id_fkey;
    END IF;
END $$;

-- Only drop competitions constraints if the table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'competitions') THEN
        ALTER TABLE competitions DROP CONSTRAINT IF EXISTS competitions_created_by_fkey;
    END IF;
END $$;

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_user_id_fkey;
ALTER TABLE payouts DROP CONSTRAINT IF EXISTS payouts_user_id_fkey;

-- Only drop risk table constraints if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'risk_thresholds') THEN
        ALTER TABLE risk_thresholds DROP CONSTRAINT IF EXISTS risk_thresholds_admin_id_fkey;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'risk_alerts') THEN
        ALTER TABLE risk_alerts DROP CONSTRAINT IF EXISTS risk_alerts_user_id_fkey;
        ALTER TABLE risk_alerts DROP CONSTRAINT IF EXISTS risk_alerts_acknowledged_by_fkey;
        ALTER TABLE risk_alerts DROP CONSTRAINT IF EXISTS risk_alerts_dismissed_by_fkey;
        ALTER TABLE risk_alerts DROP CONSTRAINT IF EXISTS risk_alerts_created_by_fkey;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'risk_events') THEN
        ALTER TABLE risk_events DROP CONSTRAINT IF EXISTS risk_events_user_id_fkey;
    END IF;
END $$;

-- Change the id column type from UUID to TEXT
ALTER TABLE users ALTER COLUMN id TYPE TEXT;

-- Recreate all the foreign key constraints
ALTER TABLE challenges ADD CONSTRAINT challenges_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE orders ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE orders ADD CONSTRAINT orders_affiliate_id_fkey FOREIGN KEY (affiliate_id) REFERENCES users(id);
ALTER TABLE contracts ADD CONSTRAINT contracts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE admin_logs ADD CONSTRAINT admin_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES users(id);
ALTER TABLE payments ADD CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE payouts ADD CONSTRAINT payouts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Only recreate affiliates constraints if the table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'affiliates') THEN
        ALTER TABLE affiliates ADD CONSTRAINT affiliates_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Only recreate referrals constraints if the table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referrals') THEN
        ALTER TABLE referrals ADD CONSTRAINT referrals_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE;
        ALTER TABLE referrals ADD CONSTRAINT referrals_referred_user_id_fkey FOREIGN KEY (referred_user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Only recreate competitions constraints if the table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'competitions') THEN
        ALTER TABLE competitions ADD CONSTRAINT competitions_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id);
    END IF;
END $$;

-- Only recreate risk table constraints if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'risk_thresholds') THEN
        ALTER TABLE risk_thresholds ADD CONSTRAINT risk_thresholds_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES users(id);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'risk_alerts') THEN
        ALTER TABLE risk_alerts ADD CONSTRAINT risk_alerts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        ALTER TABLE risk_alerts ADD CONSTRAINT risk_alerts_acknowledged_by_fkey FOREIGN KEY (acknowledged_by) REFERENCES users(id);
        ALTER TABLE risk_alerts ADD CONSTRAINT risk_alerts_dismissed_by_fkey FOREIGN KEY (dismissed_by) REFERENCES users(id);
        ALTER TABLE risk_alerts ADD CONSTRAINT risk_alerts_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'risk_events') THEN
        ALTER TABLE risk_events ADD CONSTRAINT risk_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Recreate RLS policies for users table
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Verify the change
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'id';
