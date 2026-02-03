-- Mission Control Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Team Members (the AI agents)
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  emoji TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('active', 'idle', 'offline')),
  session_key TEXT,
  last_activity TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES team_members(id),
  status TEXT NOT NULL DEFAULT 'backlog' CHECK (status IN ('backlog', 'active', 'blocked', 'review', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES team_members(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'blocked', 'review', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  blocked_by UUID REFERENCES tasks(id),
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Feed
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_member_id UUID REFERENCES team_members(id),
  project_id UUID REFERENCES projects(id),
  task_id UUID REFERENCES tasks(id),
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'success')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts (for blocked items, failures, etc.)
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_member_id UUID REFERENCES team_members(id),
  project_id UUID REFERENCES projects(id),
  type TEXT NOT NULL CHECK (type IN ('blocked', 'failed', 'needs_input', 'cost_warning', 'milestone')),
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  dedup_key TEXT,
  acknowledged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Cost Tracking
CREATE TABLE daily_costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_member_id UUID REFERENCES team_members(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  input_tokens BIGINT DEFAULT 0,
  output_tokens BIGINT DEFAULT 0,
  cost_usd DECIMAL(10,4) DEFAULT 0,
  UNIQUE(team_member_id, date)
);

-- Users (for auth - Supliful team members)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('admin', 'member', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial team members
INSERT INTO team_members (name, emoji, role, status) VALUES
  ('Iris', '🫡', 'Orchestrator', 'active'),
  ('Max', '🔧', 'Product Engineer', 'idle'),
  ('Nina', '📈', 'Growth', 'idle'),
  ('Blake', '💰', 'Investor Relations', 'idle'),
  ('Eli', '✍️', 'Content', 'idle'),
  ('Pixel', '👧', 'Creative Companion', 'offline');

-- Insert sample projects
INSERT INTO projects (name, description, owner_id, status, priority) 
SELECT 
  'Mission Control',
  'AI team orchestration dashboard',
  id,
  'active',
  'high'
FROM team_members WHERE name = 'Iris';

INSERT INTO projects (name, description, owner_id, status, priority)
SELECT 
  'iOS App Submit',
  'Submit DO IT to App Store',
  id,
  'blocked',
  'high'
FROM team_members WHERE name = 'Max';

INSERT INTO projects (name, description, owner_id, status, priority)
SELECT 
  'Series A Deck',
  'Investor presentation for Q1 2026 raise',
  id,
  'active',
  'high'
FROM team_members WHERE name = 'Blake';

INSERT INTO projects (name, description, owner_id, status, priority)
SELECT 
  'LinkedIn Pipeline',
  'Weekly content calendar and posts',
  id,
  'backlog',
  'medium'
FROM team_members WHERE name = 'Eli';

-- Enable Row Level Security
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policies (allow authenticated users to read all, write based on role)
CREATE POLICY "Allow authenticated read" ON team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON daily_costs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON users FOR SELECT TO authenticated USING (true);

-- Service role can do everything (for API/agents)
CREATE POLICY "Service role full access" ON team_members FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON projects FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON tasks FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON activities FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON alerts FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON daily_costs FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON users FOR ALL TO service_role USING (true);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE team_members;
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE activities;
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;

-- Indexes for performance
CREATE INDEX idx_activities_created ON activities(created_at DESC);
CREATE INDEX idx_activities_team_member ON activities(team_member_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_alerts_acknowledged ON alerts(acknowledged) WHERE NOT acknowledged;
CREATE INDEX idx_daily_costs_date ON daily_costs(date DESC);
