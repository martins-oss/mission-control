'use client'
import { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import { HeroStatCard } from '@/components/HeroStatCard'
import { AGENTS, AGENT_MAP } from '@/lib/constants'

interface UsageData {
  agents: Record<string, {
    totalTokens: number
    totalCost: number
    sessions: number
    model: string
  }>
  total: { tokens: number; cost: number }
  weekly: Array<{ week: string; cost: number }>
  fetchedAt: string
}

export default function UsagePage() {
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [snapshotting, setSnapshotting] = useState(false)

  useEffect(() => {
    fetchUsage()
  }, [])

  async function fetchUsage() {
    try {
      const res = await fetch('/api/usage/snapshot')
      if (res.ok) {
        const data = await res.json()
        setUsage(data)
      }
    } catch (err) {
      console.error('Failed to fetch usage:', err)
    }
    setLoading(false)
  }

  async function createSnapshot() {
    setSnapshotting(true)
    try {
      const res = await fetch('/api/usage/snapshot', { method: 'POST' })
      if (res.ok) {
        await fetchUsage()
      } else {
        alert('Failed to create snapshot: ' + (await res.text()))
      }
    } catch (err) {
      alert('Failed to create snapshot')
    }
    setSnapshotting(false)
  }

  const totalCostFormatted = usage?.total.cost.toFixed(2) || '0.00'
  const totalTokensFormatted = usage ? (usage.total.tokens / 1_000_000).toFixed(2) + 'M' : '0'

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-white">Token Usage</h1>
          <p className="text-white/60 text-lg mt-2">API cost tracking per agent (last 30 days)</p>
        </div>
        <button
          onClick={createSnapshot}
          disabled={snapshotting}
          className="px-4 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {snapshotting ? 'Updating...' : 'Update Now'}
        </button>
      </div>

      {loading ? (
        <div className="text-white/40 text-sm py-12 text-center">Loading usage data...</div>
      ) : !usage ? (
        <div className="text-center py-12">
          <p className="text-white/30 text-sm mb-4">No usage data yet</p>
          <button
            onClick={createSnapshot}
            disabled={snapshotting}
            className="px-4 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-sm font-medium transition-colors"
          >
            Create First Snapshot
          </button>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <HeroStatCard
              label="Total Cost"
              value={`$${totalCostFormatted}`}
              icon="◆"
              accentColor="emerald"
            />
            <HeroStatCard
              label="Total Tokens"
              value={totalTokensFormatted}
              icon="◈"
              accentColor="blue"
            />
            <HeroStatCard
              label="Active Agents"
              value={Object.keys(usage.agents).length}
              icon="◉"
              accentColor="emerald"
            />
            <HeroStatCard
              label="Avg Cost/Agent"
              value={`$${(usage.total.cost / Object.keys(usage.agents).length).toFixed(2)}`}
              icon="◊"
              accentColor="gray"
            />
          </div>

          {/* Per-Agent Breakdown */}
          <div className="mb-12">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-white mb-6">Per-Agent Usage</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {AGENTS.map(agent => {
                const agentUsage = usage.agents[agent.id]
                if (!agentUsage) return null

                const costFormatted = agentUsage.totalCost.toFixed(2)
                const tokensFormatted = (agentUsage.totalTokens / 1_000_000).toFixed(2)
                const costPercent = ((agentUsage.totalCost / usage.total.cost) * 100).toFixed(0)

                return (
                  <div
                    key={agent.id}
                    className="
                      bg-white/[0.03] backdrop-blur-sm
                      rounded-2xl p-6 
                      border border-white/[0.08]
                      hover:border-emerald-500/30 hover:bg-white/[0.05]
                      transition-all duration-500
                      shadow-lg shadow-black/20
                    "
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <img
                        src={agent.avatar}
                        alt={agent.name}
                        className="w-12 h-12 rounded-full ring-2 ring-white/10"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display text-base font-semibold text-white mb-1">
                          {agent.name}
                        </h3>
                        <p className="text-white/40 text-xs">{agent.role}</p>
                        <p className="text-white/25 text-xs font-mono mt-1">{agentUsage.model}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex items-baseline justify-between mb-1">
                          <span className="text-white/40 text-xs">Cost</span>
                          <span className="text-emerald-400 text-2xl font-bold">${costFormatted}</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500/50"
                            style={{ width: `${costPercent}%` }}
                          />
                        </div>
                        <p className="text-white/25 text-xs mt-1">{costPercent}% of total</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-white/40 text-xs">Tokens</span>
                        <span className="text-white/70 text-sm font-medium">{tokensFormatted}M</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-white/40 text-xs">Sessions</span>
                        <span className="text-white/70 text-sm font-medium">{agentUsage.sessions}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Weekly Trend */}
          {usage.weekly && usage.weekly.length > 0 && (
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-white mb-6">Weekly Trend</h2>
              <div className="bg-white/[0.03] backdrop-blur-sm rounded-2xl p-6 border border-white/[0.08] shadow-lg shadow-black/20">
                <div className="space-y-4">
                  {usage.weekly.map((week, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/60 text-sm">{week.week}</span>
                        <span className="text-white/90 font-medium">${week.cost.toFixed(2)}</span>
                      </div>
                      <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500/50 to-emerald-400/50"
                          style={{ width: `${(week.cost / Math.max(...usage.weekly.map(w => w.cost))) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Last Updated */}
          {usage.fetchedAt && (
            <p className="text-white/25 text-xs mt-8 text-center">
              Last updated: {new Date(usage.fetchedAt).toLocaleString()}
            </p>
          )}
        </>
      )}
    </AppShell>
  )
}
