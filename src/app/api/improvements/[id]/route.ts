import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const { action } = body

  if (action === 'approve') {
    const { data, error } = await supabase
      .from('improvements')
      .update({
        status: 'approved',
        approved_by: 'martins', // TODO: Get from auth
        approved_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  }

  if (action === 'reject') {
    const { data, error } = await supabase
      .from('improvements')
      .update({
        status: 'rejected',
        approved_by: 'martins', // TODO: Get from auth
        approved_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
