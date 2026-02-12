# LinkedIn OAuth Scope Error Fix

## Error
`unauthorized_scope_error` when trying to connect LinkedIn OAuth

## Root Cause
The LinkedIn Developer App doesn't have the required scopes enabled.

## Required Scopes

Mission Control requests these 3 scopes:
1. **`w_member_social`** — Required to post on behalf of the user
2. **`openid`** — Required for OAuth authentication
3. **`profile`** — Required to get user profile information

## Fix Steps

### 1. Go to LinkedIn Developer Portal
https://www.linkedin.com/developers/apps

### 2. Select your Mission Control app

### 3. Go to "Products" tab
Click on "Products" in the left sidebar

### 4. Enable Required Products

You need to request access to:
- **Sign In with LinkedIn using OpenID Connect** (for `openid` and `profile` scopes)
- **Share on LinkedIn** or **Marketing Developer Platform** (for `w_member_social` scope)

**Important:** Some products require LinkedIn review before they're approved. If your app is still in review, the OAuth flow will fail.

### 5. Check "Auth" tab
Go to "Auth" → "OAuth 2.0 scopes"

Verify these scopes are listed:
- ✅ `openid`
- ✅ `profile`  
- ✅ `w_member_social`

If any are missing, you need to enable the corresponding product first.

### 6. Verify Redirect URIs
In the "Auth" tab, under "Redirect URLs", make sure you have:

```
https://mission.dothework.fit/api/linkedin/callback
```

### 7. Check App Status
At the top of the app page, check the status:
- ✅ **Active** — Good to go
- ⏳ **In Review** — Wait for LinkedIn approval
- ❌ **Rejected** — Need to reapply with more details

## Common Issues

### "This app is in review"
**Solution:** Wait for LinkedIn to approve your app. This can take 1-2 weeks.

### "w_member_social not available"
**Solution:** You need to apply for "Share on LinkedIn" or "Marketing Developer Platform" product access. These require LinkedIn review.

### "Scopes don't match"
**Solution:** 
1. Remove the product that grants the scope
2. Re-add it
3. Wait a few minutes for LinkedIn's systems to sync

## Testing After Fix

1. Go to https://mission.dothework.fit/linkedin
2. Click "Connect LinkedIn"
3. You should see LinkedIn's consent screen with the 3 scopes listed
4. Approve the permissions
5. You'll be redirected back with `?linkedin=connected`

If you see an error, check the URL params for details:
- `?linkedin=error&reason=unauthorized_scope_error` — Scopes still not enabled
- `?linkedin=error&reason=token_exchange` — Check client ID/secret on Vercel

## Alternative: Use Fewer Scopes (Temporary)

If you can't get `w_member_social` approved yet, you can temporarily remove it to test OAuth:

Edit `src/app/api/linkedin/authorize/route.ts`:
```typescript
const scope = 'openid profile'  // Removed w_member_social
```

**Note:** This will allow OAuth to work, but posting to LinkedIn will fail. Only use for testing.

## Vercel Env Vars (Reminder)

Make sure these are set on Vercel:
```
LINKEDIN_CLIENT_ID=(from LinkedIn Developer Portal → Auth → Client ID)
LINKEDIN_CLIENT_SECRET=(from LinkedIn Developer Portal → Auth → Client Secret)
NEXT_PUBLIC_APP_URL=https://mission.dothework.fit
```
