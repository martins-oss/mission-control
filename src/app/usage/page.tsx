'use client'
import { useMemo } from 'react'
import AppShell from '@/components/AppShell'
import { useUsage } from '@/lib/hooks'
import { AGENTS, AGENT_MAP, formatModel } from '@/lib/constants'

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toString()
}

function formatCost(n: number): string {
  if (n < 0.01) return '<$0.01'
  return `$${n.toFixed(2)}`
}

export default function UsagePage() {
  const { usage, loading } = useUsage()

  const sortedAgents = useMemo(() => {
    if (!usage) return []
    return Object.entries(usage.agents)
      .sort(([, a], [, b]) => b.tokens - a.tokens)
      .map(([id, data]) => ({ id, ...data }))
  }, [usage])

  const maxTokens = sortedAgents[0]?.tokens || 1

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Token Usage</h1>
          <p className="text-white/40 text-sm mt-0.5">
            Per-agent token consumption and estimated cost
            {usage && <span className="text-white/20 ml-2">Updated {new Date(usage.fetchedAt).toLocaleTimeString()}</span>}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-white/40 text-sm py-12 text-center">Loading usage data...</div>
      ) : !usage ? (
        <div className="text-white/40 text-sm py-12 text-center">Unable to fetch usage data</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <div className="bg-white/[0.06] backdrop-blur-xl rounded-xl p-4 border border-white/[0.1]">
              <p className="text-white/50 text-[10px] uppercase tracking-wider font-medium">Total Tokens</p>
              <p className="text-2xl font-bold text-white mt-1">{formatTokens(usage.total.tokens)}</p>
            </div>
            <div className="bg-white/[0.06] backdrop-blur-xl rounded-xl p-4 border border-white/[0.1]">
              <p className="text-white/50 text-[10px] uppercase tracking-wider font-medium">Est. Cost</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{formatCost(usage.total.cost)}</p>
            </div>
            <div className="bg-white/[0.06] backdrop-blur-xl rounded-xl p-4 border border-white/[0.1]">
              <p className="text-white/50 text-[10px] uppercase tracking-wider font-medium">Active Agents</p>
              <p className="text-2xl font-bold text-white mt-1">{sortedAgents.filter(a => a.tokens > 0).length}</p>
            </div>
            <div className="bg-white/[0.06] backdrop-blur-xl rounded-xl p-4 border border-white/[0.1]">
              <p className="text-white/50 text-[10px] uppercase tracking-wider font-medium">Sessions</p>
              <p className="text-2xl font-bold text-white mt-1">{sortedAgents.reduce((s, a) => s + a.sessions, 0)}</p>
            </div>
          </div>

          {/* Per-Agent Breakdown */}
          <div className="mb-8">
            <h2 className="text-white/50 text-[10px] uppercase tracking-wider font-medium mb-4">Per-Agent Breakdown</h2>
            <div className="space-y-3">
              {sortedAgents.map(agent => {
                const meta = AGENT_MAP[agent.id]
                const pct = maxTokens > 0 ? (agent.tokens / maxTokens) * 100 : 0
                return (
                  <div key={agent.id} className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {meta?.avatar ? (
                          <img src={(meta as any).avatar} alt="" className="w-8 h-8 rounded-full" />
                        ) : (
                          <span className="text-lg">{meta?.emoji || '?'}</span>
                        )}
                        <div>
                          <p className="text-white font-medium text-sm">{meta?.name || agent.id}</p>
                          <p className="text-white/30 text-[10px] font-mono">{formatModel(agent.model)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-semibold text-sm">{formatTokens(agent.tokens)}</p>
                        <p className="text-emerald-400/70 text-xs">{formatCost(agent.cost)}</p>
                      </div>
                    </div>
                    {/* Bar */}
                    <div className="w-full bg-white/[0.04] rounded-full h-2 mt-1">
                      <div
                        className="bg-emerald-500/50 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1.5 text-[10px] text-white/25">
                      <span>{agent.sessions} session{agent.sessions !== 1 ? 's' : ''}</span>
                      <span>{Math.round(pct)}% of total</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Cost Distribution */}
          <div>
            <h2 className="text-white/50 text-[10px] uppercase tracking-wider font-medium mb-3">Cost by Model</h2>
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
              {(() => {
                const byModel: Record<string, { tokens: number; cost: number; agents: string[] }> = {}
                sortedAgents.forEach(a => {
                  const m = formatModel(a.model) || 'Unknown'
                  if (!byModel[m]) byModel[m] = { tokens: 0, cost: 0, agents: [] }
                  byModel[m].tokens += a.tokens
                  byModel[m].cost += a.cost
                  if (!byModel[m].agents.includes(a.id)) byModel[m].agents.push(a.id)
                })
                return Object.entries(byModel)
                  .sort(([, a], [, b]) => b.cost - a.cost)
                  .map(([model, data]) => (
                    <div key={model} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                      <div>
                        <p className="text-white/70 text-sm font-medium">{model}</p>
                        <p className="text-white/25 text-[10px]">
                          {data.agents.map(id => AGENT_MAP[id]?.name || id).join(', ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/70 text-sm">{formatTokens(data.tokens)}</p>
                        <p className="text-emerald-400/60 text-xs">{formatCost(data.cost)}</p>
                      </div>
                    </div>
                  ))
              })()}
            </div>
          </div>
        </>
      )}
    </AppShell>
  )
}
