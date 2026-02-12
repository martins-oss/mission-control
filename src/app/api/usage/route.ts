import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

const supabase = getServiceClient()

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:18789'
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN!

interface SessionData {
  key: string
  model?: string
  totalTokens?: number
  updatedAt?: number
}

// Pricing per 1M tokens (USD)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'claude-opus-4-6':           { input: 15, output: 75 },
  'claude-sonnet-4-5-20250929': { input: 3, output: 15 },
  'claude-sonnet-4-5':         { input: 3, output: 15 },
  'claude-haiku-3-5':          { input: 0.25, output: 1.25 },
}

function estimateCost(tokens: number, model: string): number {
  // Rough estimate: assume 40% input, 60% output
  const pricing = Object.entries(MODEL_PRICING).find(([k]) => model.includes(k))?.[1]
  if (!pricing) return 0
  const inputTokens = tokens * 0.4
  const outputTokens = tokens * 0.6
  return (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000
}

function extractAgentId(key: string): string | null {
  // agent:max:main → max, agent:main:main → main, agent:dash:main → dash
  const match = key.match(/^agent:([^:]+):/)
  return match ? match[1] : null
}

// GET: Fetch current usage from gateway + historical from Supabase
export async function GET(req: NextRequest) {
  const includeHistory = req.nextUrl.searchParams.get('history') === 'true'

  try {
    // Fetch sessions from gateway
    const res = await fetch(`${GATEWAY_URL}/api/sessions?limit=50`, {
      headers: { 'Authorization': `Bearer ${GATEWAY_TOKEN}` },
    })

    let sessions: SessionData[] = []
    if (res.ok) {
      const data = await res.json()
      sessions = data.sessions || []
    }

    // Aggregate by agent
    const agentUsage: Record<string, { tokens: number; cost: number; model: string; sessions: number }> = {}

    for (const session of sessions) {
      const agentId = extractAgentId(session.key)
      if (!agentId) continue

      if (!agentUsage[agentId]) {
        agentUsage[agentId] = { tokens: 0, cost: 0, model: '', sessions: 0 }
      }

      const tokens = session.totalTokens || 0
      agentUsage[agentId].tokens += tokens
      agentUsage[agentId].cost += estimateCost(tokens, session.model || '')
      agentUsage[agentId].sessions += 1
      if (session.model && !agentUsage[agentId].model) {
        agentUsage[agentId].model = session.model
      }
    }

    // Total
    const totalTokens = Object.values(agentUsage).reduce((s, a) => s + a.tokens, 0)
    const totalCost = Object.values(agentUsage).reduce((s, a) => s + a.cost, 0)

    let history: any[] = []
    if (includeHistory) {
      const { data } = await supabase
        .from('usage_snapshots')
        .select('*')
        .order('snapshot_date', { ascending: false })
        .limit(30)
      history = data || []
    }

    return NextResponse.json({
      agents: agentUsage,
      total: { tokens: totalTokens, cost: Math.round(totalCost * 100) / 100 },
      history,
      fetchedAt: new Date().toISOString(),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST: Take a snapshot (called by cron)
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!auth || auth !== GATEWAY_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Fetch current usage
    const res = await fetch(`${GATEWAY_URL}/api/sessions?limit=50`, {
      headers: { 'Authorization': `Bearer ${GATEWAY_TOKEN}` },
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
    }

    const data = await res.json()
    const sessions: SessionData[] = data.sessions || []

    // Store snapshot per agent session
    const snapshots = sessions
      .filter(s => extractAgentId(s.key))
      .map(s => ({
        agent_id: extractAgentId(s.key)!,
        total_tokens: s.totalTokens || 0,
        model: s.model || null,
        session_key: s.key,
      }))

    if (snapshots.length > 0) {
      const { error } = await supabase.from('usage_snapshots').insert(snapshots)
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, snapshots: snapshots.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
