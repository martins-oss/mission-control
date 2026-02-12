import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY not set, using ANON_KEY (may hit RLS restrictions)')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// PATCH: Update post status (approve, schedule, reject)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      console.error('PATCH /api/linkedin/posts: missing id')
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    updates.updated_at = new Date().toISOString()

    console.log('Updating LinkedIn post:', id, 'with updates:', Object.keys(updates))

    const { data, error } = await supabase
      .from('linkedin_posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Supabase update error:', error)
      return NextResponse.json({ error: error.message, details: error }, { status: 500 })
    }

    if (!data) {
      console.error('Update succeeded but no data returned for id:', id)
      return NextResponse.json({ error: 'Post not found or update failed' }, { status: 404 })
    }

    console.log('Successfully updated post:', id)
    return NextResponse.json(data)
  } catch (err) {
    console.error('PATCH /api/linkedin/posts exception:', err)
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : 'Unknown error',
      details: err 
    }, { status: 500 })
  }
}
