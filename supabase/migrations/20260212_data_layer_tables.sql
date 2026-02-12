-- Mission Control Data Layer Tables
-- Created: 2026-02-12
-- Purpose: Supabase as data source, populated by OpenClaw cron jobs

-- Agent Usage Tracking
CREATE TABLE IF NOT EXISTS agent_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  date DATE NOT NULL,
  model TEXT NOT NULL,
  input_tokens BIGINT DEFAULT 0,
  output_tokens BIGINT DEFAULT 0,
  cache_read_tokens BIGINT DEFAULT 0,
  cache_write_tokens BIGINT DEFAULT 0,
  input_cost NUMERIC(10, 4) DEFAULT 0,
  output_cost NUMERIC(10, 4) DEFAULT 0,
  cache_read_cost NUMERIC(10, 4) DEFAULT 0,
  cache_write_cost NUMERIC(10, 4) DEFAULT 0,
  total_cost NUMERIC(10, 4) DEFAULT 0,
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Unique constraint: one record per agent per date
  UNIQUE(agent_id, date)
);

-- Cron Jobs Status
CREATE TABLE IF NOT EXISTS cron_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL UNIQUE,
  name TEXT,
  schedule JSONB NOT NULL,
  payload_kind TEXT NOT NULL,
  session_target TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Agent Workspaces
CREATE TABLE IF NOT EXISTS agent_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  size_bytes BIGINT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Unique constraint: one record per agent per file
  UNIQUE(agent_id, file_path)
);

-- RLS Policies: Restrict to authenticated @supliful.com users
ALTER TABLE agent_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE cron_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_workspaces ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
CREATE POLICY "Allow authenticated users to read agent_usage"
  ON agent_usage FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email LIKE '%@supliful.com'
    )
  );

CREATE POLICY "Allow authenticated users to read cron_jobs"
  ON cron_jobs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email LIKE '%@supliful.com'
    )
  );

CREATE POLICY "Allow authenticated users to read agent_workspaces"
  ON agent_workspaces FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email LIKE '%@supliful.com'
    )
  );

-- Allow service role (cron jobs) to insert/update
CREATE POLICY "Allow service role to write agent_usage"
  ON agent_usage FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role to write cron_jobs"
  ON cron_jobs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role to write agent_workspaces"
  ON agent_workspaces FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Indexes for common queries
CREATE INDEX idx_agent_usage_agent_date ON agent_usage(agent_id, date DESC);
CREATE INDEX idx_agent_usage_date ON agent_usage(date DESC);
CREATE INDEX idx_cron_jobs_enabled ON cron_jobs(enabled, next_run);
CREATE INDEX idx_agent_workspaces_agent ON agent_workspaces(agent_id);
