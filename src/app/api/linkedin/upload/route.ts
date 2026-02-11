import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const BUCKET = 'linkedin-assets'
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const postId = formData.get('postId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    // Generate unique path
    const ext = file.name.split('.').pop() || 'bin'
    const timestamp = Date.now()
    const path = postId
      ? `posts/${postId}/${timestamp}.${ext}`
      : `uploads/${timestamp}.${ext}`

    const buffer = Buffer.from(await file.arrayBuffer())

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path)
    const publicUrl = urlData.publicUrl

    // If postId provided, append to post's media_urls
    if (postId) {
      const { data: post } = await supabase
        .from('linkedin_posts')
        .select('media_urls')
        .eq('id', postId)
        .single()

      const currentUrls = (post?.media_urls as string[]) || []
      await supabase
        .from('linkedin_posts')
        .update({
          media_urls: [...currentUrls, publicUrl],
          updated_at: new Date().toISOString(),
        })
        .eq('id', postId)

    }

    return NextResponse.json({ url: publicUrl, path: data.path })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 })
  }
}
