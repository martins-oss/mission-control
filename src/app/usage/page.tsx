'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import AppShell from '@/components/AppShell'
import { HeroStatCard } from '@/components/HeroStatCard'
import { supabase, AgentUsage } from '@/lib/supabase'
import { AGENT_MAP, AGENT_COLORS, MISSIONS } from '@/lib/constants'

// Dynamically import Recharts (client-only)
const AreaChart = dynamic(() => import('recharts').then(m => m.AreaChart), { ssr: false })
const Area = dynamic(() => import('recharts').then(m => m.Area), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false })
const CartesianGrid = dynamic(() => import('recharts').then(m => m.CartesianGrid), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })

export default function UsagePage() {
  const [usage, setUsage] = useState<AgentUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d')

  const fetchUsage = useCallback(async () => {
    setLoading(true)
    const daysAgo = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
    const threshold = new Date()
    threshold.setDate(threshold.getDate() - daysAgo)

    const { data, error } = await supabase
      .from('agent_usage')
      .select('*')
      .gte('date', threshold.toISOString().split('T')[0])
      .order('date', { ascending: false })

    if (!error && data) setUsage(data)
    setLoading(false)
  }, [dateRange])

  useEffect(() => {
    fetchUsage()
    const interval = setInterval(fetchUsage, 60000)
    return () => clearInterval(interval)
  }, [fetchUsage])

  // Aggregate by agent
  const agentTotals = useMemo(() => {
    const totals: Record<string, { tokens: number; cost: number; messages: number; model: string }> = {}
    for (const r of usage) {
      if (!totals[r.agent_id]) totals[r.agent_id] = { tokens: 0, cost: 0, messages: 0, model: r.model }
      totals[r.agent_id].tokens += r.input_tokens + r.output_tokens
      totals[r.agent_id].cost += r.total_cost
      totals[r.agent_id].messages += r.message_count
      totals[r.agent_id].model = r.model
    }
    return totals
  }, [usage])

  const totalTokens = Object.values(agentTotals).reduce((s, a) => s + a.tokens, 0)
  const totalCost = Object.values(agentTotals).reduce((s, a) => s + a.cost, 0)
  const totalMessages = Object.values(agentTotals).reduce((s, a) => s + a.messages, 0)
  const daysCount = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
  const avgPerDay = daysCount > 0 ? totalCost / daysCount : 0

  // Chart data: daily cost per agent (stacked)
  const chartData = useMemo(() => {
    const dailyMap: Record<string, Record<string, number>> = {}
    for (const r of usage) {
      if (!dailyMap[r.date]) dailyMap[r.date] = {}
      dailyMap[r.date][r.agent_id] = (dailyMap[r.date][r.agent_id] || 0) + r.total_cost
    }
    return Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, agents]) => ({
        date: date.slice(5), // MM-DD
        ...agents,
      }))
  }, [usage])

  const agentIds = useMemo(() =>
    Object.entries(agentTotals)
      .sort((a, b) => b[1].cost - a[1].cost)
      .map(([id]) => id),
    [agentTotals]
  )

  // Leaderboard sorted by cost
  const leaderboard = useMemo(() =>
    Object.entries(agentTotals)
      .sort((a, b) => b[1].cost - a[1].cost),
    [agentTotals]
  )

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header + Range */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-arcade text-sm text-neon-green text-glow-green mb-2">
              📊 HIGH SCORES
            </h1>
            <p className="text-white/30 text-xs font-mono">
              TOKEN USAGE & COST LEADERBOARD
            </p>
          </div>
          <div className="flex items-center gap-1">
            {(['7d', '30d', '90d'] as const).map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`
                  px-3 py-1.5 rounded text-[10px] font-mono transition-all
                  ${dateRange === range
                    ? 'bg-neon-green/10 text-neon-green border border-neon-green/20'
                    : 'text-white/30 hover:text-white/50 border border-transparent'
                  }
                `}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <HeroStatCard
            label="Total Tokens"
            value={`${(totalTokens / 1_000_000).toFixed(1)}M`}
            icon="🎯"
            color="green"
          />
          <HeroStatCard
            label="Total Cost"
            value={`$${totalCost.toFixed(2)}`}
            icon="💰"
            color="amber"
          />
          <HeroStatCard
            label="Avg/Day"
            value={`$${avgPerDay.toFixed(2)}`}
            icon="📈"
            color="blue"
          />
          <HeroStatCard
            label="Messages"
            value={totalMessages.toLocaleString()}
            icon="💬"
            color="purple"
          />
        </div>

        {/* Stacked Area Chart */}
        <div className="arcade-card p-5">
          <h2 className="font-arcade text-[9px] text-white/30 mb-4 tracking-widest">
            DAILY COST BY AGENT
          </h2>
          {chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center">
              <p className="font-arcade text-[10px] text-white/15">NO DATA</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                    tickLine={false}
                    tickFormatter={(v: number) => `$${v.toFixed(0)}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111118',
                      border: '1px solid rgba(57,255,20,0.2)',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                    }}
                    labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
                    formatter={(value: any, name: any) => {
                      const agent = AGENT_MAP[String(name)]
                      return [`$${Number(value).toFixed(2)}`, agent?.name || String(name)]
                    }}
                  />
                  {agentIds.map(id => {
                    const color = AGENT_COLORS[id]?.neon || '#888'
                    return (
                      <Area
                        key={id}
                        type="monotone"
                        dataKey={id}
                        stackId="1"
                        stroke={color}
                        fill={color}
                        fillOpacity={0.15}
                        strokeWidth={1.5}
                      />
                    )
                  })}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="arcade-card overflow-hidden">
          <div className="p-4 border-b border-arcade-border">
            <h2 className="font-arcade text-[9px] text-white/30 tracking-widest">
              🏆 LEADERBOARD
            </h2>
          </div>
          {loading ? (
            <div className="p-8 text-center">
              <p className="font-arcade text-[10px] text-white/20 loading-text">CALCULATING</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="p-8 text-center">
              <p className="font-arcade text-[10px] text-white/15">NO SCORES YET</p>
            </div>
          ) : (
            <div className="divide-y divide-arcade-border">
              {leaderboard.map(([agentId, data], i) => {
                const agent = AGENT_MAP[agentId]
                const color = AGENT_COLORS[agentId]?.neon || '#888'
                const pct = totalCost > 0 ? (data.cost / totalCost * 100) : 0
                const maxCost = leaderboard[0]?.[1]?.cost || 1
                const barWidth = (data.cost / maxCost * 100)

                return (
                  <div key={agentId} className="p-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <span className="font-arcade text-[10px] w-6 text-center" style={{
                        color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'rgba(255,255,255,0.2)',
                      }}>
                        #{i + 1}
                      </span>

                      {/* Agent */}
                      <div className="flex items-center gap-2 w-28">
                        <span className="text-lg">{agent?.emoji || '🤖'}</span>
                        <span className="font-arcade text-[9px]" style={{ color }}>
                          {(agent?.name || agentId).toUpperCase()}
                        </span>
                      </div>

                      {/* Bar */}
                      <div className="flex-1">
                        <div className="h-4 bg-white/[0.03] rounded-none overflow-hidden">
                          <div
                            className="h-full transition-all duration-500"
                            style={{
                              width: `${barWidth}%`,
                              backgroundColor: color + '40',
                              borderRight: `2px solid ${color}`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="text-right w-32">
                        <p className="font-arcade text-[10px]" style={{ color }}>
                          ${data.cost.toFixed(2)}
                        </p>
                        <p className="text-white/20 text-[9px] font-mono">
                          {(data.tokens / 1_000_000).toFixed(1)}M · {pct.toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Cost by Mission */}
        <div className="arcade-card p-5">
          <h2 className="font-arcade text-[9px] text-white/30 mb-4 tracking-widest">
            ⚡ COST BY MISSION
          </h2>
          <p className="text-white/15 text-[10px] font-mono mb-4">
            Based on primary mission ownership. Agents working across missions attributed to their primary.
          </p>
          <div className="space-y-3">
            {(() => {
              // Map agent costs to their primary mission
              const missionCosts: Record<string, { cost: number; agents: string[] }> = {}
              for (const mission of MISSIONS) {
                missionCosts[mission.id] = { cost: 0, agents: [] }
              }
              // Attribute each agent's cost to their primary mission
              for (const [agentId, data] of Object.entries(agentTotals)) {
                const mission = MISSIONS.find(m => m.owner === agentId)
                if (mission) {
                  missionCosts[mission.id].cost += data.cost
                  missionCosts[mission.id].agents.push(agentId)
                }
              }
              const maxCost = Math.max(...Object.values(missionCosts).map(m => m.cost), 1)
              return Object.entries(missionCosts)
                .filter(([, data]) => data.cost > 0)
                .sort((a, b) => b[1].cost - a[1].cost)
                .map(([missionId, data]) => {
                  const mission = MISSIONS.find(m => m.id === missionId)
                  const ownerColor = AGENT_COLORS[mission?.owner || '']?.neon || '#888'
                  const barWidth = (data.cost / maxCost) * 100
                  return (
                    <div key={missionId} className="flex items-center gap-3">
                      <div className="w-40 flex items-center gap-2">
                        <span className="text-sm">{AGENT_MAP[mission?.owner || '']?.emoji || '📁'}</span>
                        <span className="font-arcade text-[9px] truncate" style={{ color: ownerColor }}>
                          {mission?.name.toUpperCase() || missionId}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="h-4 bg-white/[0.03] rounded-none overflow-hidden">
                          <div
                            className="h-full transition-all duration-500"
                            style={{ width: `${barWidth}%`, backgroundColor: ownerColor + '40', borderRight: `2px solid ${ownerColor}` }}
                          />
                        </div>
                      </div>
                      <span className="font-arcade text-[10px] w-20 text-right" style={{ color: ownerColor }}>
                        ${data.cost.toFixed(2)}
                      </span>
                    </div>
                  )
                })
            })()}
          </div>
        </div>

        {/* Model Breakdown */}
        <div className="arcade-card p-5">
          <h2 className="font-arcade text-[9px] text-white/30 mb-4 tracking-widest">
            MODEL BREAKDOWN
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(() => {
              const modelTotals: Record<string, { tokens: number; cost: number }> = {}
              for (const r of usage) {
                const model = r.model.includes('opus') ? 'Opus 4.6' :
                              r.model.includes('sonnet') ? 'Sonnet 4.5' :
                              r.model.includes('haiku') ? 'Haiku' : r.model
                if (!modelTotals[model]) modelTotals[model] = { tokens: 0, cost: 0 }
                modelTotals[model].tokens += r.input_tokens + r.output_tokens
                modelTotals[model].cost += r.total_cost
              }
              return Object.entries(modelTotals)
                .sort((a, b) => b[1].cost - a[1].cost)
                .map(([model, data]) => {
                  const isOpus = model.includes('Opus')
                  const color = isOpus ? '#B24BF3' : model.includes('Sonnet') ? '#00D4FF' : '#39FF14'
                  return (
                    <div key={model} className="flex items-center justify-between p-3 rounded"
                      style={{ backgroundColor: color + '08', border: `1px solid ${color}15` }}
                    >
                      <div>
                        <p className="font-arcade text-[9px]" style={{ color }}>{model}</p>
                        <p className="text-white/20 text-[10px] font-mono mt-0.5">
                          {(data.tokens / 1_000_000).toFixed(1)}M tokens
                        </p>
                      </div>
                      <p className="font-arcade text-[11px]" style={{ color }}>
                        ${data.cost.toFixed(2)}
                      </p>
                    </div>
                  )
                })
            })()}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
