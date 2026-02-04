-- Add documentation columns to team_members table
ALTER TABLE team_members 
  ADD COLUMN IF NOT EXISTS soul_md TEXT,
  ADD COLUMN IF NOT EXISTS agents_md TEXT,
  ADD COLUMN IF NOT EXISTS tools_md TEXT;
