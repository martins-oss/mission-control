import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')
  const errorDescription = req.nextUrl.searchParams.get('error_description')

  // Handle OAuth errors
  if (error) {
    console.error('LinkedIn OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      new URL(`/linkedin?linkedin=error&reason=${encodeURIComponent(error)}`, req.url)
    )
  }

  if (!code) {
    console.error('No authorization code received')
    return NextResponse.redirect(new URL('/linkedin?linkedin=error&reason=no_code', req.url))
  }

  // Check required env vars
  if (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET) {
    console.error('Missing LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET')
    return NextResponse.redirect(new URL('/linkedin?linkedin=error&reason=config', req.url))
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
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      }),
    })

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text()
      console.error('LinkedIn token exchange failed:', tokenRes.status, errorText)
      return NextResponse.redirect(
        new URL(`/linkedin?linkedin=error&reason=token_exchange&status=${tokenRes.status}`, req.url)
      )
    }

    const tokenData = await tokenRes.json()
    
    if (!tokenData.access_token) {
      console.error('No access token in response:', tokenData)
      return NextResponse.redirect(new URL('/linkedin?linkedin=error&reason=no_token', req.url))
    }

    const accessToken = tokenData.access_token
    const expiresIn = tokenData.expires_in || 5184000 // Default 60 days
    const refreshToken = tokenData.refresh_token || null

    // Get user profile to get the URN
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    })

    if (!profileRes.ok) {
      const errorText = await profileRes.text()
      console.error('LinkedIn profile fetch failed:', profileRes.status, errorText)
      return NextResponse.redirect(
        new URL(`/linkedin?linkedin=error&reason=profile_fetch&status=${profileRes.status}`, req.url)
      )
    }

    const profile = await profileRes.json()
    
    if (!profile.sub) {
      console.error('No sub in profile:', profile)
      return NextResponse.redirect(new URL('/linkedin?linkedin=error&reason=no_sub', req.url))
    }

    const userUrn = `urn:li:person:${profile.sub}`
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

    // Delete old tokens first
    await supabase.from('linkedin_auth').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // Insert new token
    const { error: insertError } = await supabase.from('linkedin_auth').insert({
      user_urn: userUrn,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
    })

    if (insertError) {
      console.error('Failed to store LinkedIn auth:', insertError)
      return NextResponse.redirect(
        new URL(`/linkedin?linkedin=error&reason=db_insert&details=${encodeURIComponent(insertError.message)}`, req.url)
      )
    }

    // Success!
    return NextResponse.redirect(new URL('/linkedin?linkedin=connected', req.url))
  } catch (err) {
    console.error('LinkedIn OAuth exception:', err)
    const errorMsg = err instanceof Error ? err.message : String(err)
    return NextResponse.redirect(
      new URL(`/linkedin?linkedin=error&reason=exception&details=${encodeURIComponent(errorMsg)}`, req.url)
    )
  }
}
