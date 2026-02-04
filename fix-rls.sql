-- Fix RLS warnings: Enable RLS on all tables
-- Run this in Supabase SQL Editor

-- Enable RLS on all tables
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create simple policies that allow:
-- 1. Authenticated users can read everything
-- 2. Service role has full access (for API calls)

-- team_members
DROP POLICY IF EXISTS "Allow authenticated read" ON public.team_members;
DROP POLICY IF EXISTS "Service role full access" ON public.team_members;
CREATE POLICY "Allow authenticated read" ON public.team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role full access" ON public.team_members FOR ALL TO service_role USING (true);

-- projects
DROP POLICY IF EXISTS "Allow authenticated read" ON public.projects;
DROP POLICY IF EXISTS "Service role full access" ON public.projects;
CREATE POLICY "Allow authenticated read" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role full access" ON public.projects FOR ALL TO service_role USING (true);

-- tasks
DROP POLICY IF EXISTS "Allow authenticated read" ON public.tasks;
DROP POLICY IF EXISTS "Service role full access" ON public.tasks;
CREATE POLICY "Allow authenticated read" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role full access" ON public.tasks FOR ALL TO service_role USING (true);

-- activities
DROP POLICY IF EXISTS "Allow authenticated read" ON public.activities;
DROP POLICY IF EXISTS "Service role full access" ON public.activities;
CREATE POLICY "Allow authenticated read" ON public.activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role full access" ON public.activities FOR ALL TO service_role USING (true);

-- alerts
DROP POLICY IF EXISTS "Allow authenticated read" ON public.alerts;
DROP POLICY IF EXISTS "Service role full access" ON public.alerts;
CREATE POLICY "Allow authenticated read" ON public.alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role full access" ON public.alerts FOR ALL TO service_role USING (true);

-- daily_costs
DROP POLICY IF EXISTS "Allow authenticated read" ON public.daily_costs;
DROP POLICY IF EXISTS "Service role full access" ON public.daily_costs;
CREATE POLICY "Allow authenticated read" ON public.daily_costs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role full access" ON public.daily_costs FOR ALL TO service_role USING (true);

-- chat_messages
DROP POLICY IF EXISTS "Allow authenticated read" ON public.chat_messages;
DROP POLICY IF EXISTS "Service role full access" ON public.chat_messages;
CREATE POLICY "Allow authenticated read" ON public.chat_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Service role full access" ON public.chat_messages FOR ALL TO service_role USING (true);

-- users
DROP POLICY IF EXISTS "Allow authenticated read" ON public.users;
DROP POLICY IF EXISTS "Service role full access" ON public.users;
CREATE POLICY "Allow authenticated read" ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role full access" ON public.users FOR ALL TO service_role USING (true);

-- Also add the docs columns while we're here
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS soul_md TEXT,
ADD COLUMN IF NOT EXISTS agents_md TEXT,
ADD COLUMN IF NOT EXISTS tools_md TEXT;
