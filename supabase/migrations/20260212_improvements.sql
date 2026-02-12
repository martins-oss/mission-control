-- Improvements proposals table
CREATE TABLE IF NOT EXISTS improvements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  impact TEXT NOT NULL CHECK (impact IN ('low', 'medium', 'high')),
  risk TEXT NOT NULL CHECK (risk IN ('low', 'medium', 'high')),
  owner TEXT,
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'needs_approval', 'approved', 'rejected', 'implemented')),
  outcome TEXT,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  implemented_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS policies
ALTER TABLE improvements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Improvements readable by authenticated supliful users"
  ON improvements FOR SELECT
  USING (auth.jwt()->>'email' LIKE '%@supliful.com');

CREATE POLICY "Improvements writable by authenticated supliful users"
  ON improvements FOR ALL
  USING (auth.jwt()->>'email' LIKE '%@supliful.com');

-- Indexes
CREATE INDEX idx_improvements_status ON improvements(status);
CREATE INDEX idx_improvements_owner ON improvements(owner);
CREATE INDEX idx_improvements_created_at ON improvements(created_at DESC);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_improvements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER improvements_updated_at
  BEFORE UPDATE ON improvements
  FOR EACH ROW
  EXECUTE FUNCTION update_improvements_updated_at();
