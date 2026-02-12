import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { getModelPricing } from '@/lib/constants'

const supabase = getServiceClient()

export const dynamic = 'force-dynamic'

// GET: Fetch usage from agent_usage Supabase table (populated hourly by sync script)
export async function GET(req: NextRequest) {
  const days = parseInt(req.nextUrl.searchParams.get('days') || '30')
  const includeHistory = req.nextUrl.searchParams.get('history') === 'true'

  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startStr = startDate.toISOString().split('T')[0]

    const { data: usageRows, error } = await supabase
      .from('agent_usage')
      .select('*')
      .gte('date', startStr)
      .order('date', { ascending: false })

    if (error) throw error

    // Aggregate by agent
    const agentUsage: Record<string, { tokens: number; cost: number; model: string; sessions: number }> = {}

    for (const row of usageRows || []) {
      const id = row.agent_id
      if (!agentUsage[id]) {
        agentUsage[id] = { tokens: 0, cost: 0, model: row.model || '', sessions: 0 }
      }
      agentUsage[id].tokens += (row.input_tokens || 0) + (row.output_tokens || 0) + (row.cache_read_tokens || 0)
      agentUsage[id].cost += parseFloat(row.total_cost || 0)
      agentUsage[id].sessions += row.message_count || 0
      if (row.model && !agentUsage[id].model) agentUsage[id].model = row.model
    }

    const totalTokens = Object.values(agentUsage).reduce((s, a) => s + a.tokens, 0)
    const totalCost = Object.values(agentUsage).reduce((s, a) => s + a.cost, 0)

    return NextResponse.json({
      agents: agentUsage,
      total: { tokens: totalTokens, cost: Math.round(totalCost * 100) / 100 },
      history: includeHistory ? (usageRows || []) : [],
      fetchedAt: new Date().toISOString(),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
