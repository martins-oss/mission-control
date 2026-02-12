# Mission Control Production Issues — 2026-02-12

## Critical Issues Found

### 1. **Missing Vercel Environment Variables** 🔴
**Affected:** Cron, Usage/Token Dashboard, Agent Status updates

**Root Cause:** API routes expect `GATEWAY_URL` and `GATEWAY_TOKEN` but they're not set on Vercel.

**Files affected:**
- `src/app/api/cron/route.ts` — Falls back to `http://localhost:18789`
- `src/app/api/usage/route.ts` — Falls back to `http://localhost:18789`
- `src/app/api/usage/snapshot/route.ts`
- `src/app/api/agents/status/route.ts`

**Fix Required:**
Add to Vercel environment variables:
```
GATEWAY_URL=https://gateway.dothework.fit
GATEWAY_TOKEN=b145984ec813d89da40b4c31e1723e6d53f3efa54404c175
```

---

### 2. **Workspace Viewer Not Production-Ready** 🔴
**Affected:** Agent Workspaces on Network page

**Root Cause:** `src/app/api/agents/[id]/workspace/route.ts` tries to read `~/.openclaw/workspace-*` from Vercel's serverless functions. This won't work because:
- Vercel functions don't have access to the VPS filesystem
- `process.env.HOME` is not the VPS home directory

**Fix Required:**
Two options:
1. **Remove the feature** (hide workspace viewer button until we implement option 2)
2. **Create gateway API endpoint** that serves workspace data from the VPS

**Immediate fix:** Hide the workspace viewer UI until we implement gateway endpoint.

---

### 3. **LinkedIn OAuth Failing** 🔴
**Affected:** LinkedIn Scheduler connection

**Possible causes:**
1. LinkedIn app redirect URI not whitelisted correctly
2. Invalid client credentials
3. Missing scopes on LinkedIn app
4. Rate limiting or app review status

**Debug steps needed:**
1. Check LinkedIn Developer Portal: https://www.linkedin.com/developers/apps
   - Verify redirect URI: `https://mission.dothework.fit/api/linkedin/callback`
   - Verify scopes enabled: `w_member_social`, `openid`, `profile`
   - Check app status (in review? suspended?)
2. Test OAuth flow and capture actual error from LinkedIn
3. Check Vercel function logs for `/api/linkedin/callback`

**Immediate action:** Need Martin to check LinkedIn Developer Portal configuration.

---

### 4. **Network Visualization Hard to Understand** 🟡
**Affected:** Network page graph

**Issue:** No immediate technical bug, but UX could be clearer.

**Potential improvements:**
- Add tooltips on hover
- Show connection labels
- Add legend with node type descriptions
- Simplify layout

**Priority:** Lower — functional but needs polish.

---

## Action Plan

### Immediate (Martin needs to do):
1. **Set Vercel env vars** at https://vercel.com/martins-oss/mission-control/settings/environment-variables:
   ```
   GATEWAY_URL=https://gateway.dothework.fit
   GATEWAY_TOKEN=b145984ec813d89da40b4c31e1723e6d53f3efa54404c175
   ```
2. **Redeploy** Mission Control on Vercel
3. **Check LinkedIn Developer Portal** for app configuration

### Max will do:
1. **Hide workspace viewer** until gateway endpoint is built
2. **Fix LinkedIn OAuth** once we know the actual error
3. **Add better error messages** to all API routes (show actual errors to admins)
4. **Add health check endpoint** that verifies all env vars are set

---

## Why This Happened

I built and tested features on the VPS where:
- Gateway is at `localhost:18789` (so defaults worked)
- Workspace files are locally accessible
- LinkedIn OAuth wasn't tested end-to-end in production

**Lesson:** Need to test deployed Vercel build against production gateway, not just local dev server.

---

## Next Session Checklist

Before reporting "DONE & LIVE":
1. ✅ Code deployed to Vercel
2. ✅ Check Vercel env vars are set
3. ✅ Test feature on mission.dothework.fit (not just localhost)
4. ✅ Verify data is loading (not empty states)
5. ✅ Check Vercel function logs for errors

---

## Deployment Verification Script

```bash
# Test all API endpoints from production
curl -s https://mission.dothework.fit/api/cron | jq
curl -s https://mission.dothework.fit/api/usage | jq
curl -s https://mission.dothework.fit/api/agents/max/workspace | jq
```

If any return `localhost` or connection errors, env vars are not set correctly.
