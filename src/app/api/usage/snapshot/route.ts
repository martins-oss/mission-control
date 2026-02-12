import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN!

const supabase = getServiceClient()

export const dynamic = 'force-dynamic'

// Model pricing (per 1M tokens)
const MODEL_PRICING: Record<string, { prompt: number; completion: number }> = {
  'claude-opus-4-6': { prompt: 15, completion: 75 },
  'claude-sonnet-4-5': { prompt: 3, completion: 15 },
  'anthropic/claude-opus-4-6': { prompt: 15, completion: 75 },
  'anthropic/claude-sonnet-4-5-20250929': { prompt: 3, completion: 15 },
}

function getModelPricing(model: string) {
  // Try exact match first
  if (MODEL_PRICING[model]) return MODEL_PRICING[model]
  
  // Try partial match
  if (model.includes('opus')) return MODEL_PRICING['claude-opus-4-6']
  if (model.includes('sonnet')) return MODEL_PRICING['claude-sonnet-4-5']
  
  // Default to Sonnet pricing
  return MODEL_PRICING['claude-sonnet-4-5']
}

function estimateCost(promptTokens: number, completionTokens: number, model: string): number {
  const pricing = getModelPricing(model)
  const promptCost = (promptTokens / 1_000_000) * pricing.prompt
  const completionCost = (completionTokens / 1_000_000) * pricing.completion
  return promptCost + completionCost
}

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.includes(GATEWAY_TOKEN)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get session data from OpenClaw
    const { stdout } = await execAsync('openclaw sessions list --json')
    const sessions = JSON.parse(stdout)

    const today = new Date().toISOString().split('T')[0]
    const agentUsage: Record<string, {
      totalTokens: number
      promptTokens: number
      completionTokens: number
      sessions: number
      model: string
    }> = {}

    // Aggregate by agent
    for (const session of sessions) {
      const agentId = session.agentId || 'unknown'
      const model = session.model || 'claude-sonnet-4-5'
      
      if (!agentUsage[agentId]) {
        agentUsage[agentId] = {
          totalTokens: 0,
          promptTokens: 0,
          completionTokens: 0,
          sessions: 0,
          model,
        }
      }

      agentUsage[agentId].totalTokens += session.totalTokens || 0
      agentUsage[agentId].promptTokens += session.promptTokens || 0
      agentUsage[agentId].completionTokens += session.completionTokens || 0
      agentUsage[agentId].sessions++
    }

    // Upsert snapshots to Supabase
    const snapshots = Object.entries(agentUsage).map(([agentId, usage]) => ({
      agent_id: agentId,
      snapshot_date: today,
      total_tokens: usage.totalTokens,
      prompt_tokens: usage.promptTokens,
      completion_tokens: usage.completionTokens,
      model: usage.model,
      estimated_cost_usd: estimateCost(usage.promptTokens, usage.completionTokens, usage.model),
      session_count: usage.sessions,
    }))

    // Upsert (on conflict update)
    for (const snapshot of snapshots) {
      await supabase
        .from('usage_snapshots')
        .upsert(snapshot, { onConflict: 'agent_id,snapshot_date,model' })
    }

    return NextResponse.json({ 
      success: true, 
      snapshots: snapshots.length,
      date: today,
    })
  } catch (error) {
    console.error('Usage snapshot failed:', error)
    return NextResponse.json({ 
      error: 'Failed to create snapshot',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Get last 30 days of snapshots
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const startDate = thirtyDaysAgo.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('usage_snapshots')
      .select('*')
      .gte('snapshot_date', startDate)
      .order('snapshot_date', { ascending: false })

    if (error) throw error

    // Aggregate by agent
    const agentTotals: Record<string, {
      totalTokens: number
      totalCost: number
      sessions: number
      model: string
    }> = {}

    let grandTotal = { tokens: 0, cost: 0 }

    for (const snap of data || []) {
      if (!agentTotals[snap.agent_id]) {
        agentTotals[snap.agent_id] = {
          totalTokens: 0,
          totalCost: 0,
          sessions: 0,
          model: snap.model || 'unknown',
        }
      }

      agentTotals[snap.agent_id].totalTokens += snap.total_tokens || 0
      agentTotals[snap.agent_id].totalCost += parseFloat(snap.estimated_cost_usd || 0)
      agentTotals[snap.agent_id].sessions += snap.session_count || 0

      grandTotal.tokens += snap.total_tokens || 0
      grandTotal.cost += parseFloat(snap.estimated_cost_usd || 0)
    }

    // Weekly breakdown (last 4 weeks)
    const weeklyData = []
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - (i * 7))
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() - 7)

      const weekSnapshots = (data || []).filter(s => {
        const snapDate = new Date(s.snapshot_date)
        return snapDate >= weekEnd && snapDate < weekStart
      })

      const weekTotal = weekSnapshots.reduce((sum, s) => sum + parseFloat(s.estimated_cost_usd || 0), 0)
      weeklyData.push({
        week: `Week ${i + 1}`,
        cost: weekTotal,
      })
    }

    return NextResponse.json({
      agents: agentTotals,
      total: grandTotal,
      history: data,
      weekly: weeklyData.reverse(),
      fetchedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Usage fetch failed:', error)
    return NextResponse.json({ error: 'Failed to fetch usage' }, { status: 500 })
  }
}
