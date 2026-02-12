# Mission Control Data Pipeline Setup

## Overview

Mission Control now uses **Supabase as the data layer** instead of calling the gateway API. Three new tables store the data:

1. `agent_usage` — Token usage and costs per agent per day
2. `cron_jobs` — Scheduled task status (enabled, last run, next run)
3. `agent_workspaces` — File tree data for workspace viewer (optional)

## Tables Created ✅

All three tables have been created in the `vogtsynqcrnwexxlrsec` Supabase project with:
- RLS policies (read: authenticated @supliful.com users, write: service role)
- Proper indexes for common queries
- Unique constraints to prevent duplicates

## Required Cron Jobs

You need to set up **OpenClaw cron jobs** to populate these tables. Here's what's needed:

---

### 1. Agent Usage Snapshot (Daily)

**Purpose:** Aggregate token usage per agent per day

**Schedule:** Once per day at midnight UTC

**Implementation:**
```javascript
// Pseudo-code for the cron job
// Run: openclaw sessions list --json
// For each session:
//   - Extract agent_id from session key (agent:max:main → max)
//   - Get today's date
//   - Sum: input_tokens, output_tokens, cache_read_tokens, cache_write_tokens
//   - Calculate costs using model pricing
//   - Upsert into agent_usage table (unique on agent_id + date)
```

**Supabase insert:**
```sql
INSERT INTO agent_usage (
  agent_id, date, model, 
  input_tokens, output_tokens, cache_read_tokens, cache_write_tokens,
  input_cost, output_cost, cache_read_cost, cache_write_cost,
  total_cost, message_count
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
ON CONFLICT (agent_id, date) DO UPDATE SET
  input_tokens = agent_usage.input_tokens + EXCLUDED.input_tokens,
  output_tokens = agent_usage.output_tokens + EXCLUDED.output_tokens,
  -- ... (aggregate all fields)
  total_cost = agent_usage.total_cost + EXCLUDED.total_cost;
```

**Model Pricing (for cost calculation):**
- Opus 4.6: $15/$75 per 1M input/output tokens
- Sonnet 4.5: $3/$15 per 1M input/output tokens
- Haiku 3.5: $0.25/$1.25 per 1M input/output tokens

---

### 2. Cron Jobs Snapshot (Every 5 minutes)

**Purpose:** Sync OpenClaw cron jobs to Mission Control

**Schedule:** Every 5 minutes

**Implementation:**
```javascript
// Pseudo-code
// Run: cron list (via gateway API or internal)
// For each job:
//   - Extract: job_id, name, schedule, payload_kind, session_target, enabled
//   - Get: last_run, next_run from job status
//   - Upsert into cron_jobs table (unique on job_id)
```

**Supabase upsert:**
```sql
INSERT INTO cron_jobs (
  job_id, name, schedule, payload_kind, session_target, 
  enabled, last_run, next_run
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
ON CONFLICT (job_id) DO UPDATE SET
  enabled = EXCLUDED.enabled,
  last_run = EXCLUDED.last_run,
  next_run = EXCLUDED.next_run,
  updated_at = now();
```

---

### 3. Agent Workspace Scanner (Optional, Every Hour)

**Purpose:** Index agent workspace files for the workspace viewer

**Schedule:** Once per hour

**Implementation:**
```javascript
// Pseudo-code
// For each agent (main, max, dash, atlas, amber):
//   - Scan ~/.openclaw/workspace-{agent}/ recursively (3 levels max)
//   - For each file: agent_id, file_path (relative), size_bytes
//   - Upsert into agent_workspaces table (unique on agent_id + file_path)
```

**Note:** This is optional. The workspace viewer is currently hidden because it can't read VPS filesystem from Vercel. If you implement this, we can re-enable the feature.

---

## Environment Variables (Reminder)

Make sure these are set in the **OpenClaw gateway config** for the cron jobs to access Supabase:

```bash
SUPABASE_URL=https://vogtsynqcrnwexxlrsec.supabase.co
SUPABASE_SERVICE_ROLE_KEY=(from Mission Control .env.local)
```

The service role key bypasses RLS and can insert/update data.

---

## Testing

After setting up the cron jobs, verify data is populating:

```bash
# Check agent_usage
curl -s "https://vogtsynqcrnwexxlrsec.supabase.co/rest/v1/agent_usage?limit=5" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | jq

# Check cron_jobs
curl -s "https://vogtsynqcrnwexxlrsec.supabase.co/rest/v1/cron_jobs?limit=5" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | jq
```

Or visit:
- https://mission.dothework.fit/usage
- https://mission.dothework.fit/cron

---

## Benefits of This Approach

1. **No gateway API needed** — Gateway serves the Control UI (HTML), Mission Control uses Supabase
2. **Real-time updates** — Cron jobs keep data fresh
3. **Historical data** — Can track trends over time
4. **Scalable** — Supabase handles all the heavy lifting
5. **Secure** — RLS policies restrict access to @supliful.com users

---

## Next Steps

1. Implement the 2 required cron jobs (usage snapshot + cron sync)
2. Optionally implement workspace scanner if you want that feature
3. Verify data is showing up on mission.dothework.fit
