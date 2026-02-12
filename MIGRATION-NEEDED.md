# Migration Required: Add agent_id to cron_jobs

## What

The new POST /api/cron-jobs endpoint requires an `agent_id` column in the `cron_jobs` table.

## How to Apply

### Option 1: Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard/project/vogtsynqcrnwexxlrsec/editor
2. Open the SQL Editor
3. Run this SQL:

```sql
ALTER TABLE cron_jobs ADD COLUMN IF NOT EXISTS agent_id TEXT;
CREATE INDEX IF NOT EXISTS idx_cron_jobs_agent ON cron_jobs(agent_id);
```

### Option 2: Local Migration File

The migration is already created at:
`supabase/migrations/20260212_add_agent_id_to_cron_jobs.sql`

If you have Supabase CLI installed:
```bash
supabase db push
```

## Verification

After running the migration, test the endpoint:

```bash
curl -X GET "https://vogtsynqcrnwexxlrsec.supabase.co/rest/v1/cron_jobs?select=agent_id&limit=1" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

If successful, you should NOT see an error about `column cron_jobs.agent_id does not exist`.
