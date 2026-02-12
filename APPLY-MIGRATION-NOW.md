# URGENT: Apply Migration Now

The POST /api/cron-jobs endpoint is deployed but WILL NOT WORK until you run this SQL in Supabase.

## Steps

1. Go to: https://supabase.com/dashboard/project/vogtsynqcrnwexxlrsec/sql/new
2. Paste this SQL:

```sql
ALTER TABLE cron_jobs ADD COLUMN IF NOT EXISTS agent_id TEXT;
CREATE INDEX IF NOT EXISTS idx_cron_jobs_agent ON cron_jobs(agent_id);
```

3. Click "Run" (Ctrl+Enter)

That's it! The endpoint will work immediately after.

## Why This Matters

The OpenClaw cron sync job is currently failing with 405 Method Not Allowed.
Once you run this SQL, it will switch to the new endpoint and start syncing cron job data to Mission Control.

## Verify It Worked

After running the SQL, this command should return JSON data (not an error):

```bash
curl -s "https://vogtsynqcrnwexxlrsec.supabase.co/rest/v1/cron_jobs?select=agent_id&limit=1" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

If it says "column cron_jobs.agent_id does not exist", the SQL didn't run.
If it returns `[]` or `[{...}]`, you're good!
