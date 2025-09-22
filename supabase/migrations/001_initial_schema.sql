-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  wallet TEXT NOT NULL UNIQUE,
  language TEXT NOT NULL DEFAULT 'en',
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
  description TEXT NOT NULL,
  params JSONB NOT NULL DEFAULT '{
    "roi": 10,
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_challenges_user_id ON challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
CREATE INDEX IF NOT EXISTS idx_trades_challenge_id ON trades(challenge_id);
CREATE INDEX IF NOT EXISTS idx_trades_market_id ON trades(market_id);
CREATE INDEX IF NOT EXISTS idx_trades_resolved ON trades(resolved);
CREATE INDEX IF NOT EXISTS idx_yields_lp_id ON yields(lp_id);
CREATE INDEX IF NOT EXISTS idx_plans_active ON plans(active);
CREATE INDEX IF NOT EXISTS idx_plans_type ON plans(type);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE yields ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

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

-- Insert default plans
INSERT INTO plans (type, description, params, fee) VALUES
  ('1-step', 'Single phase challenge with profit target', '{"roi": 6, "win_rate": 70, "drawdown": 5, "exposure": 15, "min_days": 10}', 99.00),
  ('2-step', 'Two phase challenge with evaluation and profit phases', '{"roi": 10, "win_rate": 70, "drawdown": 5, "exposure": 15, "min_days": 20}', 149.00)
ON CONFLICT DO NOTHING;
