-- Check which tables exist and create missing ones
-- Run this in Supabase SQL Editor

-- Check existing tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Create affiliates table if missing (only if users table has TEXT id)
DO $$
BEGIN
    -- Check if users.id is TEXT type (after alteration)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'id' AND data_type = 'text'
        AND table_schema = 'public'
    ) THEN
        -- Create affiliates table
        CREATE TABLE IF NOT EXISTS affiliates (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          code TEXT NOT NULL UNIQUE,
          custom_url TEXT,
          tier TEXT NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
          total_referrals INTEGER DEFAULT 0,
          total_volume NUMERIC(18, 2) DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    ELSE
        RAISE NOTICE 'Users table id column is not TEXT type yet. Run alter-users-table-id.sql first.';
    END IF;
END $$;

-- Only create tables that reference users(id) if users.id is TEXT type
DO $$
BEGIN
    -- Check if users.id is TEXT type (after alteration)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'id' AND data_type = 'text'
        AND table_schema = 'public'
    ) THEN
        -- Create referrals table if missing
        CREATE TABLE IF NOT EXISTS referrals (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          referrer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          referred_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(referrer_id, referred_user_id)
        );

        -- Create competitions table if missing
        CREATE TABLE IF NOT EXISTS competitions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          rules TEXT,
          prize_pool NUMERIC(10, 2),
          start_date TIMESTAMP WITH TIME ZONE NOT NULL,
          end_date TIMESTAMP WITH TIME ZONE NOT NULL,
          status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
          max_participants INTEGER,
          created_by TEXT REFERENCES users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create competition_participants table if missing
        CREATE TABLE IF NOT EXISTS competition_participants (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          pnl NUMERIC(18, 2) DEFAULT 0,
          rank INTEGER,
          trades_count INTEGER DEFAULT 0,
          UNIQUE(competition_id, user_id)
        );

        -- Create risk_thresholds table if missing
        CREATE TABLE IF NOT EXISTS risk_thresholds (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          admin_id TEXT REFERENCES users(id),
          thresholds JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create risk_alerts table if missing
        CREATE TABLE IF NOT EXISTS risk_alerts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
          status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'dismissed')),
          triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          acknowledged_at TIMESTAMP WITH TIME ZONE,
          acknowledged_by TEXT REFERENCES users(id),
          dismissed_at TIMESTAMP WITH TIME ZONE,
          dismissed_by TEXT REFERENCES users(id),
          created_by TEXT REFERENCES users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create risk_events table if missing
        CREATE TABLE IF NOT EXISTS risk_events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          event_type TEXT NOT NULL,
          description TEXT NOT NULL,
          value TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    ELSE
        RAISE NOTICE 'Users table id column is not TEXT type yet. Cannot create tables that reference it. Run alter-users-table-id.sql first.';
    END IF;
END $$;

-- Enable RLS and create policies only for tables that were created
DO $$
DECLARE
    tbl_name TEXT;
BEGIN
    -- List of tables to check and configure
    FOREACH tbl_name IN ARRAY ARRAY['affiliates', 'referrals', 'competitions', 'competition_participants', 'risk_thresholds', 'risk_alerts', 'risk_events']
    LOOP
        -- Enable RLS if table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = tbl_name AND table_schema = 'public') THEN
            EXECUTE 'ALTER TABLE ' || tbl_name || ' ENABLE ROW LEVEL SECURITY';
        END IF;
    END LOOP;

    -- Create policies for affiliates table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'affiliates' AND table_schema = 'public') THEN
        CREATE POLICY "Users can view their own affiliate data" ON affiliates
          FOR SELECT USING (auth.uid()::text = user_id::text);

        CREATE POLICY "Users can create their own affiliate data" ON affiliates
          FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

        CREATE POLICY "Users can update their own affiliate data" ON affiliates
          FOR UPDATE USING (auth.uid()::text = user_id::text);
    END IF;

    -- Create policies for referrals table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referrals' AND table_schema = 'public') THEN
        CREATE POLICY "Users can view referrals they made" ON referrals
          FOR SELECT USING (auth.uid()::text = referrer_id::text);

        CREATE POLICY "Users can create referrals they made" ON referrals
          FOR INSERT WITH CHECK (auth.uid()::text = referrer_id::text);
    END IF;

    -- Create policies for competitions table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'competitions' AND table_schema = 'public') THEN
        CREATE POLICY "Anyone can view active competitions" ON competitions
          FOR SELECT USING (status IN ('active', 'upcoming'));

        CREATE POLICY "Admins can manage competitions" ON competitions
          FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
    END IF;

    -- Create policies for competition_participants table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'competition_participants' AND table_schema = 'public') THEN
        CREATE POLICY "Users can view their competition participations" ON competition_participants
          FOR SELECT USING (auth.uid()::text = user_id::text);

        CREATE POLICY "Users can join competitions" ON competition_participants
          FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

        CREATE POLICY "Users can leave competitions" ON competition_participants
          FOR DELETE USING (auth.uid()::text = user_id::text);
    END IF;

    -- Create policies for risk tables if they exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'risk_thresholds' AND table_schema = 'public') THEN
        CREATE POLICY "Admins can manage risk thresholds" ON risk_thresholds
          FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'risk_alerts' AND table_schema = 'public') THEN
        CREATE POLICY "Users can view their own risk alerts" ON risk_alerts
          FOR SELECT USING (auth.uid()::text = user_id::text);

        CREATE POLICY "Admins can manage all risk alerts" ON risk_alerts
          FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'risk_events' AND table_schema = 'public') THEN
        CREATE POLICY "Users can view their own risk events" ON risk_events
          FOR SELECT USING (auth.uid()::text = user_id::text);

        CREATE POLICY "Admins can view all risk events" ON risk_events
          FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

        CREATE POLICY "System can create risk events" ON risk_events
          FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- Add update triggers for tables that exist
DO $$
DECLARE
    tbl_name TEXT;
BEGIN
    FOREACH tbl_name IN ARRAY ARRAY['affiliates', 'referrals', 'competitions', 'risk_alerts']
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = tbl_name AND table_schema = 'public') THEN
            EXECUTE 'CREATE TRIGGER update_' || tbl_name || '_updated_at BEFORE UPDATE ON ' || tbl_name || ' FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()';
        END IF;
    END LOOP;
END $$;

-- Verify all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
