-- Usage tracking tables

-- Usage snapshots (daily rollups per agent)
CREATE TABLE IF NOT EXISTS usage_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  snapshot_date DATE NOT NULL,
  total_tokens BIGINT DEFAULT 0,
  prompt_tokens BIGINT DEFAULT 0,
  completion_tokens BIGINT DEFAULT 0,
  model TEXT,
  estimated_cost_usd DECIMAL(10, 4) DEFAULT 0,
  session_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(agent_id, snapshot_date, model)
);

-- Session usage details (granular per session)
CREATE TABLE IF NOT EXISTS session_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_key TEXT NOT NULL UNIQUE,
  agent_id TEXT NOT NULL,
  model TEXT,
  total_tokens BIGINT DEFAULT 0,
  prompt_tokens BIGINT DEFAULT 0,
  completion_tokens BIGINT DEFAULT 0,
  estimated_cost_usd DECIMAL(10, 4) DEFAULT 0,
  started_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS policies
ALTER TABLE usage_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_usage ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (idempotent)
DROP POLICY IF EXISTS "Usage snapshots readable by authenticated supliful users" ON usage_snapshots;
DROP POLICY IF EXISTS "Session usage readable by authenticated supliful users" ON session_usage;

CREATE POLICY "Usage snapshots readable by authenticated supliful users"
  ON usage_snapshots FOR SELECT
  USING (auth.jwt()->>'email' LIKE '%@supliful.com');

CREATE POLICY "Session usage readable by authenticated supliful users"
  ON session_usage FOR SELECT
  USING (auth.jwt()->>'email' LIKE '%@supliful.com');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_usage_snapshots_agent_date ON usage_snapshots(agent_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_usage_snapshots_date ON usage_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_session_usage_agent ON session_usage(agent_id);
CREATE INDEX IF NOT EXISTS idx_session_usage_session ON session_usage(session_key);

-- Updated at triggers
CREATE OR REPLACE FUNCTION update_usage_snapshots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS usage_snapshots_updated_at ON usage_snapshots;
CREATE TRIGGER usage_snapshots_updated_at
  BEFORE UPDATE ON usage_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION update_usage_snapshots_updated_at();

DROP TRIGGER IF EXISTS session_usage_updated_at ON session_usage;
CREATE TRIGGER session_usage_updated_at
  BEFORE UPDATE ON session_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_usage_snapshots_updated_at();
