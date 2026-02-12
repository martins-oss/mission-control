'use client'
import { useMemo } from 'react'
import Link from 'next/link'
import AppShell from '@/components/AppShell'
import { StatusBadge } from '@/components/StatusBadge'
import { HeroStatCard } from '@/components/HeroStatCard'
import { EmptyState, TaskCardSkeleton } from '@/components/EmptyState'
import { useAgentStatus, deriveStatus, useTasks, useBlockers, useImprovements } from '@/lib/hooks'
import { AGENTS, AGENT_MAP, AGENT_COLORS, STATUS_COLORS, formatModel } from '@/lib/constants'
import type { AgentStatus } from '@/lib/supabase'

function timeAgo(date: string | null): string {
  if (!date) return 'never'
  const diff = Date.now() - new Date(date).getTime()
  const secs = Math.floor(diff / 1000)
  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function HealthBar({ status, color }: { status: string; color: string }) {
  const widths: Record<string, string> = {
    active: 'w-full',
    idle: 'w-1/2',
    offline: 'w-0',
    error: 'w-1/4',
  }
  return (
    <div className="health-bar mt-2">
      <div
        className={`health-bar-fill ${widths[status] || 'w-0'}`}
        style={{ backgroundColor: color }}
      />
    </div>
  )
}

export default function Dashboard() {
  const { statuses, loading: statusLoading } = useAgentStatus()
  const { tasks, loading: tasksLoading } = useTasks()
  const { blockers, loading: blockersLoading } = useBlockers()
  const { improvements, loading: improvementsLoading, refresh: refreshImprovements } = useImprovements()

  const handleImprovementAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      await fetch(`/api/improvements/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      refreshImprovements()
    } catch (err) {
      console.error('Action failed:', err)
    }
  }

  const statusMap = useMemo(() => {
    const m: Record<string, AgentStatus> = {}
    statuses.forEach(s => { m[s.agent_id] = s })
    return m
  }, [statuses])

  const stats = useMemo(() => {
    const active = tasks.filter(t => t.status === 'in_progress').length
    const blocked = tasks.filter(t => t.status === 'blocked').length
    const backlog = tasks.filter(t => t.status === 'backlog' || t.status === 'waiting').length
    const done = tasks.filter(t => t.status === 'done').length
    return { active, blocked, backlog, done }
  }, [tasks])

  const activeAgents = AGENTS.filter(a => {
    const s = statusMap[a.id]
    return s && deriveStatus(s) === 'active'
  }).length

  const pendingImprovements = improvements.filter(
    i => i.status === 'proposed' || i.status === 'needs_approval'
  )

  return (
    <AppShell>
      {/* ── Page Header ── */}
      <div className="mb-8">
        <h1 className="font-arcade text-sm text-neon-green text-glow-green mb-2">
          🕹️ HEADQUARTERS
        </h1>
        <p className="text-white/30 text-xs font-mono">
          SYSTEM OVERVIEW — {activeAgents} AGENT{activeAgents !== 1 ? 'S' : ''} ONLINE ·{' '}
          {stats.active} MISSION{stats.active !== 1 ? 'S' : ''} ACTIVE
          {stats.blocked > 0 && (
            <span className="text-neon-pink ml-2">· {stats.blocked} BLOCKED</span>
          )}
        </p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <HeroStatCard
          label="Agents Online"
          value={activeAgents}
          icon="👾"
          color="green"
        />
        <HeroStatCard
          label="Active Missions"
          value={tasksLoading ? '—' : stats.active}
          icon="⚡"
          color="blue"
        />
        <HeroStatCard
          label="Blocked"
          value={tasksLoading ? '—' : stats.blocked}
          icon="🚫"
          color={stats.blocked > 0 ? 'pink' : 'gray'}
        />
        <HeroStatCard
          label="Backlog"
          value={tasksLoading ? '—' : stats.backlog}
          icon="📋"
          color="gray"
        />
      </div>

      {/* ── Agent Health Bars ── */}
      <div className="mb-8">
        <h2 className="font-arcade text-[10px] text-white/40 mb-4 tracking-widest">
          AGENT STATUS
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {AGENTS.map(agent => {
            const agentStatus = statusMap[agent.id]
            const derived = agentStatus ? deriveStatus(agentStatus) : 'offline'
            const colors = AGENT_COLORS[agent.id] || AGENT_COLORS.max
            const currentTask = agentStatus?.current_task || null

            return (
              <Link
                key={agent.id}
                href="/agents"
                className={`
                  arcade-card p-4 group cursor-pointer
                  hover:border-opacity-40 transition-all duration-300
                `}
                style={{
                  borderColor: derived === 'active' ? colors.neon + '30' : undefined,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{agent.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-arcade text-[8px] text-white/70 truncate">
                        {agent.name.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-white/20 text-[10px] font-mono truncate">
                      {derived === 'active' && currentTask
                        ? currentTask.slice(0, 30)
                        : derived.toUpperCase()
                      }
                    </p>
                  </div>
                </div>
                <HealthBar status={derived} color={colors.neon} />
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── Pending Decisions ── */}
      {pendingImprovements.length > 0 && (
        <div className="mb-8">
          <h2 className="font-arcade text-[10px] text-neon-amber mb-4 tracking-widest flex items-center gap-2">
            ⚠ PENDING DECISIONS
            <span className="px-2 py-0.5 bg-neon-amber/10 text-neon-amber rounded text-[9px]">
              {pendingImprovements.length}
            </span>
          </h2>
          <div className="space-y-3">
            {pendingImprovements.slice(0, 3).map(imp => (
              <div key={imp.id} className="arcade-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white/80 text-sm font-mono mb-1">{imp.title}</h3>
                    {imp.description && (
                      <p className="text-white/30 text-xs line-clamp-2">{imp.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${
                        imp.impact === 'high' ? 'bg-neon-pink/10 text-neon-pink' :
                        imp.impact === 'medium' ? 'bg-neon-amber/10 text-neon-amber' :
                        'bg-neon-blue/10 text-neon-blue'
                      }`}>
                        {imp.impact.toUpperCase()}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${
                        imp.risk === 'low' ? 'bg-neon-green/10 text-neon-green' :
                        imp.risk === 'medium' ? 'bg-neon-amber/10 text-neon-amber' :
                        'bg-neon-pink/10 text-neon-pink'
                      }`}>
                        {imp.risk.toUpperCase()} RISK
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleImprovementAction(imp.id, 'approve')}
                      className="px-3 py-1.5 rounded bg-neon-green/10 hover:bg-neon-green/20 text-neon-green text-[10px] font-mono border border-neon-green/20 transition-all"
                    >
                      APPROVE
                    </button>
                    <button
                      onClick={() => handleImprovementAction(imp.id, 'reject')}
                      className="px-3 py-1.5 rounded bg-neon-pink/10 hover:bg-neon-pink/20 text-neon-pink text-[10px] font-mono border border-neon-pink/20 transition-all"
                    >
                      REJECT
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tasks + Blockers Split ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks (2/3) */}
        <div className="lg:col-span-2">
          <h2 className="font-arcade text-[10px] text-white/40 mb-4 tracking-widest">
            RECENT MISSIONS
          </h2>
          {tasksLoading ? (
            <div className="arcade-card overflow-hidden">
              {[...Array(5)].map((_, i) => <TaskCardSkeleton key={i} />)}
            </div>
          ) : tasks.length === 0 ? (
            <EmptyState
              icon="📡"
              title="NO MISSIONS"
              description="INSERT COIN TO CONTINUE"
            />
          ) : (
            <div className="arcade-card overflow-hidden divide-y divide-arcade-border">
              {tasks.slice(0, 10).map(task => {
                const ownerMeta = AGENT_MAP[task.owner]
                const ownerColor = AGENT_COLORS[task.owner]?.neon || '#fff'
                const sc = STATUS_COLORS[task.status]

                return (
                  <div key={task.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-mono mb-1.5 ${
                          task.status === 'done' ? 'text-white/20 line-through' : 'text-white/80'
                        }`}>
                          {task.task}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] font-mono">
                          {ownerMeta && (
                            <span style={{ color: ownerColor + 'AA' }}>
                              {ownerMeta.emoji} {ownerMeta.name}
                            </span>
                          )}
                          <span className="text-white/20">{task.project}</span>
                          {task.priority && task.priority !== 'medium' && (
                            <span className={`px-1.5 py-0.5 rounded ${
                              task.priority === 'high' || task.priority === 'critical'
                                ? 'bg-neon-pink/10 text-neon-pink'
                                : 'bg-white/5 text-white/30'
                            }`}>
                              {task.priority.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`
                        px-2 py-0.5 rounded text-[9px] font-mono uppercase
                        ${sc?.bg || 'bg-white/5'} ${sc?.text || 'text-white/30'}
                      `}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Blockers (1/3) */}
        <div>
          <h2 className="font-arcade text-[10px] text-white/40 mb-4 tracking-widest flex items-center gap-2">
            BLOCKERS
            {blockers.length > 0 && (
              <span className="px-1.5 py-0.5 bg-neon-pink/10 text-neon-pink rounded text-[9px]">
                {blockers.length}
              </span>
            )}
          </h2>
          <div className="arcade-card overflow-hidden">
            {blockersLoading ? (
              <div className="p-8 text-center">
                <p className="font-arcade text-[8px] text-white/20 loading-text">SCANNING</p>
              </div>
            ) : blockers.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-2xl mb-2 opacity-30">✓</p>
                <p className="font-arcade text-[8px] text-neon-green/40">ALL CLEAR</p>
              </div>
            ) : (
              <div className="divide-y divide-arcade-border">
                {blockers.map(b => (
                  <div key={b.id} className="p-4">
                    <p className="text-white/60 text-sm font-mono mb-2 leading-relaxed">
                      {b.description}
                    </p>
                    <div className="flex flex-col gap-1 text-[10px] font-mono">
                      <span className="text-neon-pink/60">
                        BLOCKING: {b.blocking_who}
                      </span>
                      {b.needs_input_from && (
                        <span className="text-neon-amber/60">
                          NEEDS: {b.needs_input_from}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
