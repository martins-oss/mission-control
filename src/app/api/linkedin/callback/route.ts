import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(new URL('/?linkedin=error', req.url))
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://mission.dothework.fit'}/api/linkedin/callback`

  try {
    // Exchange code for access token
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      }),
    })

    if (!tokenRes.ok) {
      const err = await tokenRes.text()
      console.error('LinkedIn token exchange failed:', err)
      return NextResponse.redirect(new URL('/?linkedin=error', req.url))
    }

    const tokenData = await tokenRes.json()
    const accessToken = tokenData.access_token
    const expiresIn = tokenData.expires_in // seconds
    const refreshToken = tokenData.refresh_token || null

    // Get user profile to get the URN
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    })

    if (!profileRes.ok) {
      console.error('LinkedIn profile fetch failed:', await profileRes.text())
      return NextResponse.redirect(new URL('/?linkedin=error', req.url))
    }

    const profile = await profileRes.json()
    const userUrn = `urn:li:person:${profile.sub}`

    // Store in Supabase (upsert — replace existing)
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

    // Delete old tokens first
    await supabase.from('linkedin_auth').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    const { error: insertError } = await supabase.from('linkedin_auth').insert({
      user_urn: userUrn,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
    })

    if (insertError) {
      console.error('Failed to store LinkedIn auth:', insertError)
      return NextResponse.redirect(new URL('/?linkedin=error', req.url))
    }

    return NextResponse.redirect(new URL('/?linkedin=connected', req.url))
  } catch (err) {
    console.error('LinkedIn OAuth error:', err)
    return NextResponse.redirect(new URL('/?linkedin=error', req.url))
  }
}
