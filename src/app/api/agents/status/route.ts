import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN

export async function POST(req: NextRequest) {
  // Auth: require gateway token
  const auth = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!auth || auth !== GATEWAY_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { agent_id, status, current_task, model, heartbeat_interval, tools } = body

  if (!agent_id) {
    return NextResponse.json({ error: 'agent_id required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('agent_status')
    .upsert({
      agent_id,
      status: status || 'active',
      current_task: current_task || null,
      last_heartbeat: new Date().toISOString(),
      model: model || null,
      heartbeat_interval: heartbeat_interval || null,
      tools: tools || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'agent_id' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function GET() {
  const { data, error } = await supabase
    .from('agent_status')
    .select('*')
    .order('agent_id')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
