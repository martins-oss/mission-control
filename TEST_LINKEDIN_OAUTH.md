# LinkedIn OAuth Debugging

## Issue
OAuth flow is broken on mission.dothework.fit despite env vars being set on Vercel.

## Hypothesis
The callback route uses `SUPABASE_SERVICE_ROLE_KEY` to insert into `linkedin_auth` table. If this env var is missing from Vercel, it falls back to `NEXT_PUBLIC_SUPABASE_ANON_KEY`, which will fail due to RLS policies.

## Test Steps

1. **Verify env vars on Vercel:**
   ```bash
   # Check Vercel project settings
   # https://vercel.com/martins-oss/mission-control/settings/environment-variables
   # Confirm these are set:
   # - LINKEDIN_CLIENT_ID ✓ (confirmed by Martins)
   # - LINKEDIN_CLIENT_SECRET ✓ (confirmed by Martins)
   # - SUPABASE_SERVICE_ROLE_KEY ??? (needs verification)
   ```

2. **Check RLS policies on linkedin_auth table:**
   ```sql
   -- If RLS is enabled, service role key is required
   -- Anon key won't have permission to insert
   ```

3. **Test the actual flow:**
   - Visit https://mission.dothework.fit/api/linkedin/authorize
   - Authorize with LinkedIn
   - Check where it redirects after callback
   - Look for error in URL params

4. **Check Vercel logs:**
   - Go to Vercel deployment logs
   - Look for console.error output from callback route
   - Errors logged: "LinkedIn token exchange failed" or "Failed to store LinkedIn auth"

## Likely Root Cause

The callback route has this fallback:
```typescript
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
```

If `SUPABASE_SERVICE_ROLE_KEY` is not set on Vercel, it uses the anon key, which will fail when trying to insert into `linkedin_auth` due to RLS policies.

## Fix

Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel environment variables:
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvZ3RzeW5xY3Jud2V4eGxyc2VjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE0NjQ5NiwiZXhwIjoyMDg1NzIyNDk2fQ.FLkrX_kn06wwS0ATYOexpqOTI65damramTE0_1vTmBE
```

Or, if we want to avoid exposing service role key in Vercel env, we need to:
1. Update RLS policies on `linkedin_auth` to allow public inserts, OR
2. Use a different authentication mechanism

## Alternative: Check LinkedIn App Configuration

The redirect URI in LinkedIn Developer Console must match exactly:
```
https://mission.dothework.fit/api/linkedin/callback
```

Not:
- http://mission.dothework.fit/api/linkedin/callback
- https://mission.dothework.fit/api/linkedin/callback/
- https://www.mission.dothework.fit/api/linkedin/callback

## Next Steps

1. Verify SUPABASE_SERVICE_ROLE_KEY is set on Vercel
2. If not, add it
3. If it is set, check Vercel function logs for actual error
4. Verify LinkedIn app redirect URI configuration
