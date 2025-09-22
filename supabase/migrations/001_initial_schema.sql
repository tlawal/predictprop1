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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_challenges_user_id ON challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
CREATE INDEX IF NOT EXISTS idx_trades_challenge_id ON trades(challenge_id);
CREATE INDEX IF NOT EXISTS idx_trades_market_id ON trades(market_id);
CREATE INDEX IF NOT EXISTS idx_trades_resolved ON trades(resolved);
CREATE INDEX IF NOT EXISTS idx_yields_lp_id ON yields(lp_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE yields ENABLE ROW LEVEL SECURITY;

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
