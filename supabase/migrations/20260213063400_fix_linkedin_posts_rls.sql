-- Fix LinkedIn posts RLS policies
-- Ensure all roles can read posts, but only service_role can write

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read" ON linkedin_posts;
DROP POLICY IF EXISTS "Allow anon read" ON linkedin_posts;
DROP POLICY IF EXISTS "Allow authenticated read" ON linkedin_posts;
DROP POLICY IF EXISTS "Service role full access" ON linkedin_posts;

-- Enable RLS
ALTER TABLE linkedin_posts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read posts (anon, authenticated, service_role)
CREATE POLICY "Allow public read on linkedin_posts"
  ON linkedin_posts
  FOR SELECT
  USING (true);

-- Only service_role can insert/update/delete
CREATE POLICY "Service role full access on linkedin_posts"
  ON linkedin_posts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant necessary permissions
GRANT SELECT ON linkedin_posts TO anon, authenticated;
GRANT ALL ON linkedin_posts TO service_role;
