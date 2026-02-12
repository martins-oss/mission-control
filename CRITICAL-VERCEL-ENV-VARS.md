# CRITICAL: Vercel Environment Variables

## ⚠️ Missing Env Vars Cause Data Loss

Martin reported LinkedIn drafts disappearing when edited. Root cause: **`SUPABASE_SERVICE_ROLE_KEY` not set on Vercel**.

Without this key, the API routes fall back to `ANON_KEY` which hits RLS restrictions and causes UPDATE operations to fail.

## Required Vercel Environment Variables

**Go to:** https://vercel.com/martins-oss/mission-control/settings/environment-variables

**Set these immediately:**

```bash
# Supabase (CRITICAL - without these, updates fail)
SUPABASE_SERVICE_ROLE_KEY=(from .env.local - bypasses RLS)
NEXT_PUBLIC_SUPABASE_URL=https://vogtsynqcrnwexxlrsec.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=(from .env.local - for frontend reads)

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=(from .env.local)
LINKEDIN_CLIENT_SECRET=(from .env.local)
NEXT_PUBLIC_APP_URL=https://mission.dothework.fit

# Gateway (not currently used, but good to have)
GATEWAY_URL=https://gateway.dothework.fit
GATEWAY_TOKEN=b145984ec813d89da40b4c31e1723e6d53f3efa54404c175
```

## How to Get Values

All values are in `~/repos/mission-control/.env.local` on the VPS:

```bash
cd ~/repos/mission-control
cat .env.local
```

## Impact of Missing Keys

| Missing Env Var | Impact |
|-----------------|--------|
| `SUPABASE_SERVICE_ROLE_KEY` | **DATA LOSS** — All updates/inserts fail silently due to RLS |
| `NEXT_PUBLIC_SUPABASE_URL` | App completely broken (no database) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend can't read data |
| `LINKEDIN_CLIENT_ID` | LinkedIn OAuth fails to start |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn OAuth callback fails |

## Verification

After setting env vars and redeploying:

```bash
# Test LinkedIn post update (should work without errors)
curl -X PATCH https://mission.dothework.fit/api/linkedin/posts \
  -H "Content-Type: application/json" \
  -d '{"id":"<post-id>","content":"Test update"}'

# Should return the updated post, not an error
```

## Warning Logs

If `SUPABASE_SERVICE_ROLE_KEY` is missing, you'll see this in Vercel function logs:

```
⚠️ SUPABASE_SERVICE_ROLE_KEY not set, using ANON_KEY (may hit RLS restrictions)
```

This warning was added in commit 650ac67 to help diagnose this exact issue.

## Steps to Fix Now

1. Go to Vercel environment variables page (link above)
2. Copy values from `.env.local` on VPS
3. Add each variable, set environment to "Production"
4. Click Save
5. Redeploy the app from Vercel dashboard

**DO NOT skip the redeploy** — env var changes require a redeploy to take effect.
