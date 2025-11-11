-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT,
  wallet TEXT NOT NULL UNIQUE,
  language TEXT NOT NULL DEFAULT 'en',
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'affiliate')),
  billing_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('1-step', '2-step', 'free-trial')),
  balance NUMERIC(20, 2) NOT NULL DEFAULT 0,
  params JSONB NOT NULL DEFAULT '{
    "profit_target": 10,
    "drawdown_max": 5,
    "exposure_cap": 15
  }',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'passed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trades table
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  market_id TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('Yes', 'No')),
  amount NUMERIC(20, 2) NOT NULL,
  entry_price NUMERIC(20, 10) NOT NULL,
  pnl NUMERIC(20, 2) NOT NULL DEFAULT 0,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create yields table
CREATE TABLE IF NOT EXISTS yields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lp_id TEXT NOT NULL,
  amount NUMERIC(20, 2) NOT NULL,
  apy NUMERIC(10, 4) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create plans table
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('1-step', '2-step')),
  size INTEGER NOT NULL,
  description TEXT NOT NULL,
  params JSONB NOT NULL DEFAULT '{
    "roi": 10,
    "accuracy_target": 70,
    "win_rate": 70,
    "drawdown": 5,
    "exposure": 15,
    "min_days": 10
  }',
  fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table for admin management
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL UNIQUE,
  plan_id UUID NOT NULL REFERENCES plans(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  addons JSONB DEFAULT '{}',
  amount NUMERIC(10, 2) NOT NULL,
  affiliate_id TEXT REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
  payment_method TEXT CHECK (payment_method IN ('stripe', 'crypto', 'bank_transfer')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('terms_of_service', 'privacy_policy', 'trading_agreement')),
  version TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'rejected')),
  signed_at TIMESTAMP WITH TIME ZONE,
  signed_ip INET,
  signed_user_agent TEXT,
  verification_code TEXT,
  code_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_logs table
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_challenges_user_id ON challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
CREATE INDEX IF NOT EXISTS idx_trades_challenge_id ON trades(challenge_id);
CREATE INDEX IF NOT EXISTS idx_trades_market_id ON trades(market_id);
CREATE INDEX IF NOT EXISTS idx_trades_resolved ON trades(resolved);
CREATE INDEX IF NOT EXISTS idx_yields_lp_id ON yields(lp_id);
CREATE INDEX IF NOT EXISTS idx_plans_active ON plans(active);
CREATE INDEX IF NOT EXISTS idx_plans_type ON plans(type);
CREATE INDEX IF NOT EXISTS idx_plans_size ON plans(size);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_plan_id ON orders(plan_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_affiliate_id ON orders(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_type ON contracts(type);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_entity ON admin_logs(entity_type, entity_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE yields ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE addons ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- RLS Policies for challenges table
CREATE POLICY "Users can view their own challenges" ON challenges
  FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can create their own challenges" ON challenges
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Users can update their own challenges" ON challenges
  FOR UPDATE USING (user_id::text = auth.uid()::text);

-- RLS Policies for trades table
CREATE POLICY "Users can view trades from their challenges" ON trades
  FOR SELECT USING (
    challenge_id IN (
      SELECT id FROM challenges WHERE user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can create trades for their challenges" ON trades
  FOR INSERT WITH CHECK (
    challenge_id IN (
      SELECT id FROM challenges WHERE user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can update trades from their challenges" ON trades
  FOR UPDATE USING (
    challenge_id IN (
      SELECT id FROM challenges WHERE user_id::text = auth.uid()::text
    )
  );

-- RLS Policies for yields table (public read, authenticated write)
CREATE POLICY "Anyone can view yields" ON yields
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create yields" ON yields
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for plans table (public read, admin write)
CREATE POLICY "Anyone can view active plans" ON plans
  FOR SELECT USING (active = true);

CREATE POLICY "Admin can manage plans" ON plans
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for orders table
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "Affiliates can view orders they referred" ON orders
  FOR SELECT USING (affiliate_id::text = auth.uid()::text);

CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update orders" ON orders
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for contracts table
CREATE POLICY "Users can view their own contracts" ON contracts
  FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can update their own contracts" ON contracts
  FOR UPDATE USING (user_id::text = auth.uid()::text);

CREATE POLICY "Admins can view all contracts" ON contracts
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update contracts" ON contracts
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for admin_logs table (admin only)
CREATE POLICY "Admins can view admin logs" ON admin_logs
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can create admin logs" ON admin_logs
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for affiliates table
CREATE POLICY "Users can view their own affiliate data" ON affiliates
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own affiliate data" ON affiliates
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own affiliate data" ON affiliates
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- RLS Policies for referrals table
CREATE POLICY "Users can view referrals they made" ON referrals
  FOR SELECT USING (auth.uid()::text = referrer_id::text);

CREATE POLICY "Users can create referrals they made" ON referrals
  FOR INSERT WITH CHECK (auth.uid()::text = referrer_id::text);

-- RLS Policies for competitions table (public read, admin write)
CREATE POLICY "Anyone can view active competitions" ON competitions
  FOR SELECT USING (status IN ('active', 'upcoming'));

CREATE POLICY "Admins can manage competitions" ON competitions
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for competition_participants table
CREATE POLICY "Users can view their competition participations" ON competition_participants
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can join competitions" ON competition_participants
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can leave competitions" ON competition_participants
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- RLS Policies for risk_thresholds table (admin only)
CREATE POLICY "Admins can manage risk thresholds" ON risk_thresholds
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for risk_alerts table
CREATE POLICY "Users can view their own risk alerts" ON risk_alerts
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Admins can manage all risk alerts" ON risk_alerts
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for risk_events table
CREATE POLICY "Users can view their own risk events" ON risk_events
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Admins can view all risk events" ON risk_events
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "System can create risk events" ON risk_events
  FOR INSERT WITH CHECK (true);

-- RLS Policies for payments table
CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "Admins can view all payments" ON payments
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update payments" ON payments
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for payouts table
CREATE POLICY "Users can view their own payouts" ON payouts
  FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "Admins can manage all payouts" ON payouts
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for addons table (public read for active, admin write)
CREATE POLICY "Anyone can view active addons" ON addons
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage addons" ON addons
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON challenges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON trades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_yields_updated_at BEFORE UPDATE ON yields
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliates_updated_at BEFORE UPDATE ON affiliates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competitions_updated_at BEFORE UPDATE ON competitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_risk_alerts_updated_at BEFORE UPDATE ON risk_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON payouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addons_updated_at BEFORE UPDATE ON addons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default plans
INSERT INTO plans (type, size, description, params, fee) VALUES
  ('1-step', 5000, 'Single phase challenge with profit target', '{"roi": 6, "accuracy_target": 70, "win_rate": 70, "drawdown": 5, "exposure": 15, "min_days": 10}', 99.00),
  ('2-step', 10000, 'Two phase challenge with evaluation and profit phases', '{"roi": 10, "accuracy_target": 70, "win_rate": 70, "drawdown": 5, "exposure": 15, "min_days": 20}', 149.00)
ON CONFLICT DO NOTHING;

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

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(referrer_id, referred_user_id)
);

-- Create competitions table
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

-- Create competition_participants table
CREATE TABLE IF NOT EXISTS competition_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  pnl NUMERIC(18, 2) DEFAULT 0,
  rank INTEGER,
  trades_count INTEGER DEFAULT 0,
  UNIQUE(competition_id, user_id)
);

-- Create risk_thresholds table
CREATE TABLE IF NOT EXISTS risk_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id TEXT REFERENCES users(id),
  thresholds JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create risk_alerts table
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

-- Create risk_events table
CREATE TABLE IF NOT EXISTS risk_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_payment_intent_id TEXT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  type TEXT NOT NULL CHECK (type IN ('evaluation', 'addon', 'subscription')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payouts table
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

-- Create addons table
CREATE TABLE IF NOT EXISTS addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  param_key TEXT NOT NULL,
  param_value JSONB,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
