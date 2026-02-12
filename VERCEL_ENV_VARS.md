# Vercel Environment Variables Required ⚠️

## 🔴 CRITICAL — Must Be Set For App To Work

The following environment variables **MUST** be configured in Vercel:

### Gateway Connection (Required for Cron, Usage, Agent Status)
```bash
GATEWAY_URL=https://gateway.dothework.fit
GATEWAY_TOKEN=b145984ec813d89da40b4c31e1723e6d53f3efa54404c175
```

### Supabase (Required for all features)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://vogtsynqcrnwexxlrsec.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=(see .env.local)
SUPABASE_SERVICE_ROLE_KEY=(see .env.local)
```

### LinkedIn OAuth (Required for LinkedIn Scheduler)
```bash
LINKEDIN_CLIENT_ID=(see .env.local)
LINKEDIN_CLIENT_SECRET=(see .env.local)
```

### Application
```bash
NEXT_PUBLIC_APP_URL=https://mission.dothework.fit
```

---

## How to Set on Vercel

1. Go to: https://vercel.com/martins-oss/mission-control/settings/environment-variables
2. Click **Add New**
3. Enter each variable name and value from above
4. Set environment to **Production** (and optionally Preview/Development)
5. Click **Save**
6. After all are added, go to Deployments tab
7. Find the latest deployment and click **⋯ → Redeploy**

---

## What Breaks Without These Vars

| Missing Var | Broken Features |
|-------------|-----------------|
| `GATEWAY_URL` | Cron page, Usage/Token dashboard, Agent heartbeats |
| `GATEWAY_TOKEN` | Same as above (401 Unauthorized) |
| `NEXT_PUBLIC_SUPABASE_URL` | Entire app (no database) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client-side data fetching fails |
| `SUPABASE_SERVICE_ROLE_KEY` | API routes can't write/update data |
| `LINKEDIN_CLIENT_ID` | Can't start OAuth flow |
| `LINKEDIN_CLIENT_SECRET` | OAuth callback fails |

---

## Verification

After setting env vars and redeploying, test each endpoint:

```bash
# Should return cron jobs list (not localhost error)
curl -s https://mission.dothework.fit/api/cron | jq

# Should return agent usage data (not empty)
curl -s https://mission.dothework.fit/api/usage | jq

# Should redirect to LinkedIn OAuth (not 500 error)
curl -I https://mission.dothework.fit/api/linkedin/authorize
```

---

## LinkedIn App Configuration

The LinkedIn Developer App must be configured with:

**Redirect URI:**
- `https://mission.dothework.fit/api/linkedin/callback`

**Scopes:**
- `w_member_social` (required for posting)
- `openid` (required for OAuth)
- `profile` (required for user info)

**App Status:**
- Must be verified/approved by LinkedIn
- Must not be in review or suspended

**Check configuration:** https://www.linkedin.com/developers/apps
