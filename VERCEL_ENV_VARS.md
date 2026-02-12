# Vercel Environment Variables Required

The following environment variables must be set in Vercel for Mission Control to work properly:

## LinkedIn OAuth
```
LINKEDIN_CLIENT_ID=(from .env.local)
LINKEDIN_CLIENT_SECRET=(from .env.local)
```

## Supabase
```
NEXT_PUBLIC_SUPABASE_URL=(from .env.local)
NEXT_PUBLIC_SUPABASE_ANON_KEY=(from .env.local)
SUPABASE_SERVICE_ROLE_KEY=(from .env.local)
```

## Application
```
NEXT_PUBLIC_APP_URL=https://mission.dothework.fit
GATEWAY_TOKEN=(from .env.local)
```

## How to Set

1. Go to https://vercel.com/martins-oss/mission-control/settings/environment-variables
2. Add each variable above
3. Set environment to "Production"
4. Redeploy the application

## OAuth Callback Configuration

LinkedIn app must have this redirect URI configured:
- `https://mission.dothework.fit/api/linkedin/callback`

Check at: https://www.linkedin.com/developers/apps
