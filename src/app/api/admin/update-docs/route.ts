import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Admin endpoint to update team member docs
// POST /api/admin/update-docs
// Body: { name: string, soul_md?: string, agents_md?: string, tools_md?: string }

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { name, soul_md, agents_md, tools_md } = await req.json()
    
    if (!name) {
      return NextResponse.json({ error: 'Missing name' }, { status: 400 })
    }

    const updates: Record<string, string> = {}
    if (soul_md !== undefined) updates.soul_md = soul_md
    if (agents_md !== undefined) updates.agents_md = agents_md
    if (tools_md !== undefined) updates.tools_md = tools_md

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No docs provided' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('team_members')
      .update(updates)
      .eq('name', name)
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Update docs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
