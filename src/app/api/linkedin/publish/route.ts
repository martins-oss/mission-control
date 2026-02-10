import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// POST: Publish a specific post now (manual trigger)
// GET: Cron — publish all due scheduled posts
export async function GET() {
  return publishDuePosts()
}

export async function POST(req: NextRequest) {
  const { postId } = await req.json()
  if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })

  const { data: post } = await supabase
    .from('linkedin_posts')
    .select('*')
    .eq('id', postId)
    .single()

  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  if (post.status !== 'approved' && post.status !== 'scheduled') {
    return NextResponse.json({ error: 'Post must be approved or scheduled' }, { status: 400 })
  }

  const result = await publishPost(post)
  return NextResponse.json(result)
}

async function publishDuePosts() {
  const now = new Date().toISOString()

  const { data: posts } = await supabase
    .from('linkedin_posts')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now)
    .order('scheduled_at', { ascending: true })
    .limit(10)

  if (!posts || posts.length === 0) {
    return NextResponse.json({ published: 0 })
  }

  const results = []
  for (const post of posts) {
    results.push(await publishPost(post))
  }

  return NextResponse.json({ published: results.filter(r => r.success).length, results })
}

async function publishPost(post: any) {
  // Get LinkedIn auth
  const { data: auth } = await supabase
    .from('linkedin_auth')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!auth) {
    await supabase.from('linkedin_posts').update({
      status: 'failed',
      error: 'No LinkedIn auth token found',
      updated_at: new Date().toISOString(),
    }).eq('id', post.id)
    return { id: post.id, success: false, error: 'No auth token' }
  }

  // Check if token is expired
  if (new Date(auth.expires_at) < new Date()) {
    await supabase.from('linkedin_posts').update({
      status: 'failed',
      error: 'LinkedIn token expired — reconnect in dashboard',
      updated_at: new Date().toISOString(),
    }).eq('id', post.id)
    return { id: post.id, success: false, error: 'Token expired' }
  }

  try {
    // Build LinkedIn post payload
    const payload: any = {
      author: auth.user_urn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: post.content,
          },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    }

    // If there's a media URL (article link), add it
    if (post.media_url) {
      payload.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'ARTICLE'
      payload.specificContent['com.linkedin.ugc.ShareContent'].media = [{
        status: 'READY',
        originalUrl: post.media_url,
        title: { text: post.title || '' },
      }]
    }

    const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const errText = await res.text()
      await supabase.from('linkedin_posts').update({
        status: 'failed',
        error: `${res.status}: ${errText.slice(0, 500)}`,
        updated_at: new Date().toISOString(),
      }).eq('id', post.id)
      return { id: post.id, success: false, error: errText.slice(0, 200) }
    }

    const linkedinPostId = res.headers.get('x-restli-id') || ''

    await supabase.from('linkedin_posts').update({
      status: 'posted',
      posted_at: new Date().toISOString(),
      linkedin_post_id: linkedinPostId,
      updated_at: new Date().toISOString(),
    }).eq('id', post.id)

    return { id: post.id, success: true, linkedinPostId }
  } catch (err: any) {
    await supabase.from('linkedin_posts').update({
      status: 'failed',
      error: err?.message || 'Unknown error',
      updated_at: new Date().toISOString(),
    }).eq('id', post.id)
    return { id: post.id, success: false, error: err?.message }
  }
}
