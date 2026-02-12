'use client'
import { useEffect, useState, useCallback } from 'react'
import AppShell from '@/components/AppShell'
import { supabase, AgentUsage } from '@/lib/supabase'
import { AGENT_MAP } from '@/lib/constants'

export default function UsagePage() {
  const [usage, setUsage] = useState<AgentUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d')

  const fetchUsage = useCallback(async () => {
    setLoading(true)
    
    // Calculate date threshold
    const daysAgo = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
    const threshold = new Date()
    threshold.setDate(threshold.getDate() - daysAgo)
    
    const { data, error } = await supabase
      .from('agent_usage')
      .select('*')
      .gte('date', threshold.toISOString().split('T')[0])
      .order('date', { ascending: false })
    
    if (error) {
      console.error('Failed to fetch usage:', error)
    } else {
      setUsage(data || [])
    }
    
    setLoading(false)
  }, [dateRange])

  useEffect(() => {
    fetchUsage()
    const interval = setInterval(fetchUsage, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [fetchUsage])

  // Aggregate by agent
  const agentTotals: Record<string, {
    tokens: number
    cost: number
    messages: number
    lastModel: string
  }> = {}

  for (const record of usage) {
    if (!agentTotals[record.agent_id]) {
      agentTotals[record.agent_id] = {
        tokens: 0,
        cost: 0,
        messages: 0,
        lastModel: record.model,
      }
    }
    agentTotals[record.agent_id].tokens += record.input_tokens + record.output_tokens
    agentTotals[record.agent_id].cost += record.total_cost
    agentTotals[record.agent_id].messages += record.message_count
    agentTotals[record.agent_id].lastModel = record.model
  }

  const totalTokens = Object.values(agentTotals).reduce((s, a) => s + a.tokens, 0)
  const totalCost = Object.values(agentTotals).reduce((s, a) => s + a.cost, 0)
  const totalMessages = Object.values(agentTotals).reduce((s, a) => s + a.messages, 0)

  // Daily totals for chart
  const dailyTotals: Record<string, { tokens: number; cost: number }> = {}
  for (const record of usage) {
    const date = record.date
    if (!dailyTotals[date]) {
      dailyTotals[date] = { tokens: 0, cost: 0 }
    }
    dailyTotals[date].tokens += record.input_tokens + record.output_tokens
    dailyTotals[date].cost += record.total_cost
  }

  const sortedDates = Object.keys(dailyTotals).sort()

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Token Usage & Costs</h1>
          <p className="text-white/40 text-sm mt-0.5">Per-agent token consumption and costs</p>
        </div>
        
        {/* Date Range Selector */}
        <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-0.5">
          {(['7d', '30d', '90d'] as const).map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                dateRange === range
                  ? 'bg-white/[0.08] text-white/80'
                  : 'text-white/30 hover:text-white/50'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-5 border border-white/[0.06]">
          <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Total Tokens</p>
          <p className="text-white text-3xl font-bold">{(totalTokens / 1_000_000).toFixed(2)}M</p>
          <p className="text-white/30 text-xs mt-1">{totalMessages.toLocaleString()} messages</p>
        </div>
        
        <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-5 border border-white/[0.06]">
          <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Total Cost</p>
          <p className="text-emerald-400 text-3xl font-bold">${totalCost.toFixed(2)}</p>
          <p className="text-white/30 text-xs mt-1">Last {dateRange === '7d' ? '7' : dateRange === '30d' ? '30' : '90'} days</p>
        </div>
        
        <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-5 border border-white/[0.06]">
          <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Avg Cost/Day</p>
          <p className="text-blue-400 text-3xl font-bold">
            ${(totalCost / (dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90)).toFixed(2)}
          </p>
          <p className="text-white/30 text-xs mt-1">Projected: ${(totalCost / (dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90) * 30).toFixed(2)}/mo</p>
        </div>
      </div>

      {/* Per-Agent Breakdown */}
      <div className="mb-8">
        <h2 className="text-white/50 text-[10px] uppercase tracking-wider font-medium mb-3">Per-Agent Usage</h2>
        <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-white/50 text-sm">Loading usage data...</div>
          ) : Object.keys(agentTotals).length === 0 ? (
            <div className="p-8 text-center text-white/40 text-sm">No usage data yet</div>
          ) : (
            <table className="w-full">
              <thead className="bg-white/[0.02]">
                <tr className="text-left text-xs text-white/40 uppercase tracking-wider">
                  <th className="px-4 py-3 font-medium">Agent</th>
                  <th className="px-4 py-3 font-medium">Model</th>
                  <th className="px-4 py-3 font-medium text-right">Tokens</th>
                  <th className="px-4 py-3 font-medium text-right">Messages</th>
                  <th className="px-4 py-3 font-medium text-right">Cost</th>
                  <th className="px-4 py-3 font-medium text-right">% of Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {Object.entries(agentTotals)
                  .sort((a, b) => b[1].cost - a[1].cost)
                  .map(([agentId, data]) => {
                    const agent = AGENT_MAP[agentId]
                    const pct = (data.cost / totalCost * 100).toFixed(1)
                    
                    return (
                      <tr key={agentId} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {agent?.avatar ? (
                              <img src={agent.avatar} alt={agent.name} className="w-6 h-6 rounded-full" />
                            ) : (
                              <span className="text-lg">{agent?.emoji || '🤖'}</span>
                            )}
                            <span className="text-white/80 font-medium text-sm">{agent?.name || agentId}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-white/50 text-xs font-mono">{data.lastModel}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-white/70 text-sm">{(data.tokens / 1_000_000).toFixed(2)}M</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-white/70 text-sm">{data.messages.toLocaleString()}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-emerald-400 text-sm font-semibold">${data.cost.toFixed(2)}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-white/50 text-sm">{pct}%</span>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Daily Trend */}
      <div>
        <h2 className="text-white/50 text-[10px] uppercase tracking-wider font-medium mb-3">Daily Trend</h2>
        <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-6">
          {sortedDates.length === 0 ? (
            <p className="text-center text-white/40 text-sm">No data</p>
          ) : (
            <div className="space-y-2">
              {sortedDates.slice(-14).map(date => {
                const data = dailyTotals[date]
                const maxCost = Math.max(...Object.values(dailyTotals).map(d => d.cost))
                const barWidth = maxCost > 0 ? (data.cost / maxCost * 100) : 0
                
                return (
                  <div key={date} className="flex items-center gap-3">
                    <span className="text-white/40 text-xs font-mono w-24">{date}</span>
                    <div className="flex-1 bg-white/[0.03] rounded-full h-6 relative overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500/30 to-emerald-500/10 rounded-full"
                        style={{ width: `${barWidth}%` }}
                      />
                      <span className="absolute inset-0 flex items-center px-3 text-xs text-white/60">
                        {(data.tokens / 1_000_000).toFixed(2)}M tokens
                      </span>
                    </div>
                    <span className="text-emerald-400 text-xs font-semibold w-16 text-right">
                      ${data.cost.toFixed(2)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
