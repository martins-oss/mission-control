-- Add agent_id column to cron_jobs table
-- Created: 2026-02-12

ALTER TABLE cron_jobs ADD COLUMN IF NOT EXISTS agent_id TEXT;

-- Add index for queries by agent
CREATE INDEX IF NOT EXISTS idx_cron_jobs_agent ON cron_jobs(agent_id);
