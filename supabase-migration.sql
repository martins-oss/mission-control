-- Migration: Add docs columns to team_members table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/vogtsynqcrnwexxlrsec/sql

-- Add docs columns
ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS soul_md TEXT,
ADD COLUMN IF NOT EXISTS agents_md TEXT,
ADD COLUMN IF NOT EXISTS tools_md TEXT;

-- Update Max's docs (run after columns are added)
UPDATE team_members 
SET soul_md = 'See /home/openclaw/.openclaw/agents/max/SOUL.md',
    agents_md = 'See /home/openclaw/.openclaw/agents/max/AGENTS.md',
    tools_md = 'See /home/openclaw/.openclaw/agents/max/TOOLS.md'
WHERE name = 'Max';
