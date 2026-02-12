'use client'
import { useMemo } from 'react'
import Link from 'next/link'
import AppShell from '@/components/AppShell'
import { useAgentStatus, deriveStatus, useTasks, useBlockers, useImprovements } from '@/lib/hooks'
import { AGENTS, AGENT_MAP, STATUS_COLORS, formatModel } from '@/lib/constants'
import type { Task, AgentStatus } from '@/lib/supabase'

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

function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.offline
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
      <span className={`w-2 h-2 rounded-full ${colors.dot} ${status === 'active' ? 'animate-pulse' : ''}`} />
      {status}
    </span>
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

  const pendingImprovements = improvements.filter(i => i.status === 'proposed' || i.status === 'needs_approval')

  return (
    <AppShell>
      {/* Hero Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Mission Control</h1>
        <p className="text-white/50 text-lg">
          {activeAgents} active agent{activeAgents !== 1 ? 's' : ''} · {stats.active} task{stats.active !== 1 ? 's' : ''} in progress
          {stats.blocked > 0 && <span className="text-red-400/70 ml-2">· {stats.blocked} blocked</span>}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <Link href="#agents" className="group">
          <div className="bg-white/[0.06] backdrop-blur-xl rounded-2xl p-6 border border-white/[0.1] hover:border-emerald-500/30 transition-all">
            <p className="text-white/40 text-xs uppercase tracking-wider font-medium mb-2">Active Agents</p>
            <p className="text-4xl font-bold text-emerald-400 group-hover:scale-105 transition-transform">{activeAgents}</p>
          </div>
        </Link>
        <Link href="#tasks" className="group">
          <div className="bg-white/[0.06] backdrop-blur-xl rounded-2xl p-6 border border-white/[0.1] hover:border-emerald-500/30 transition-all">
            <p className="text-white/40 text-xs uppercase tracking-wider font-medium mb-2">In Progress</p>
            <p className="text-4xl font-bold text-white group-hover:scale-105 transition-transform">{tasksLoading ? '—' : stats.active}</p>
          </div>
        </Link>
        <Link href="#tasks" className="group">
          <div className="bg-white/[0.06] backdrop-blur-xl rounded-2xl p-6 border border-white/[0.1] hover:border-red-500/30 transition-all">
            <p className="text-white/40 text-xs uppercase tracking-wider font-medium mb-2">Blocked</p>
            <p className={`text-4xl font-bold group-hover:scale-105 transition-transform ${stats.blocked > 0 ? 'text-red-400' : 'text-white/30'}`}>
              {tasksLoading ? '—' : stats.blocked}
            </p>
          </div>
        </Link>
        <Link href="#tasks" className="group">
          <div className="bg-white/[0.06] backdrop-blur-xl rounded-2xl p-6 border border-white/[0.1] hover:border-emerald-500/30 transition-all">
            <p className="text-white/40 text-xs uppercase tracking-wider font-medium mb-2">Backlog</p>
            <p className="text-4xl font-bold text-white/50 group-hover:scale-105 transition-transform">{tasksLoading ? '—' : stats.backlog}</p>
          </div>
        </Link>
      </div>

      {/* Agent Status Grid */}
      <div id="agents" className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-2xl font-semibold">Agents</h2>
          <Link href="/network" className="text-emerald-400/70 hover:text-emerald-400 text-sm font-medium transition-colors">
            View network →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {AGENTS.map(agent => {
            const agentStatus = statusMap[agent.id]
            const derivedStatus = agentStatus ? deriveStatus(agentStatus) : 'idle'
            const currentTask = agentStatus?.current_task || tasks.find(t => t.owner === agent.id && t.status === 'in_progress')?.task || null
            const lastSeen = agentStatus?.last_heartbeat ? timeAgo(agentStatus.last_heartbeat) : null
            const model = agentStatus?.model || null

            return (
              <div key={agent.id} className="bg-white/[0.06] backdrop-blur-xl rounded-2xl p-6 border border-white/[0.1] hover:border-emerald-500/20 transition-all group">
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative">
                    <img
                      src={agent.avatar}
                      alt={agent.name}
                      className="w-14 h-14 rounded-full ring-2 ring-white/10 group-hover:ring-emerald-500/30 transition-all"
                    />
                    <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0A0A0A] ${
                      derivedStatus === 'active' ? 'bg-emerald-500 animate-pulse' :
                      derivedStatus === 'idle' ? 'bg-yellow-500' :
                      'bg-gray-500'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-semibold text-base">{agent.name}</h3>
                      <StatusBadge status={derivedStatus} />
                    </div>
                    <p className="text-white/40 text-sm">{agent.role}</p>
                    {model && (
                      <p className="text-white/30 text-xs mt-1 font-mono">{formatModel(model)}</p>
                    )}
                  </div>
                </div>

                <div className="min-h-[60px]">
                  {currentTask ? (
                    <p className="text-emerald-400/80 text-sm leading-relaxed">{currentTask}</p>
                  ) : (
                    <p className="text-white/20 text-sm italic">No active task</p>
                  )}
                </div>

                {lastSeen && (
                  <p className="text-white/25 text-xs mt-4 pt-4 border-t border-white/[0.06]">
                    Last seen {lastSeen}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Improvements Section */}
      {pendingImprovements.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white text-2xl font-semibold">
              Pending Improvements
              <span className="ml-3 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-sm font-bold">
                {pendingImprovements.length}
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {pendingImprovements.slice(0, 5).map(improvement => (
              <div key={improvement.id} className="bg-white/[0.06] backdrop-blur-xl rounded-2xl p-6 border border-white/[0.1] hover:border-emerald-500/20 transition-all">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-white font-semibold text-base">{improvement.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        improvement.impact === 'high' ? 'bg-red-500/15 text-red-400' :
                        improvement.impact === 'medium' ? 'bg-orange-500/15 text-orange-400' :
                        'bg-blue-500/15 text-blue-400'
                      }`}>
                        {improvement.impact} impact
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        improvement.risk === 'low' ? 'bg-emerald-500/15 text-emerald-400' :
                        improvement.risk === 'medium' ? 'bg-yellow-500/15 text-yellow-400' :
                        'bg-red-500/15 text-red-400'
                      }`}>
                        {improvement.risk} risk
                      </span>
                    </div>
                    {improvement.description && (
                      <p className="text-white/60 text-sm leading-relaxed mb-3">{improvement.description}</p>
                    )}
                    {improvement.owner && (
                      <p className="text-white/30 text-xs">Owner: {improvement.owner}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleImprovementAction(improvement.id, 'approve')}
                      className="px-4 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-sm font-medium transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleImprovementAction(improvement.id, 'reject')}
                      className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tasks & Blockers Split */}
      <div id="tasks" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks (2/3 width) */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white text-2xl font-semibold">Tasks</h2>
          </div>
          {tasksLoading ? (
            <div className="bg-white/[0.06] backdrop-blur-xl rounded-2xl p-12 border border-white/[0.1] text-center text-white/40">
              Loading tasks...
            </div>
          ) : tasks.length === 0 ? (
            <div className="bg-white/[0.06] backdrop-blur-xl rounded-2xl p-12 border border-white/[0.1] text-center text-white/40">
              No tasks
            </div>
          ) : (
            <div className="bg-white/[0.06] backdrop-blur-xl rounded-2xl border border-white/[0.1] overflow-hidden">
              <div className="divide-y divide-white/[0.06]">
                {tasks.slice(0, 12).map(task => {
                  const ownerMeta = AGENT_MAP[task.owner]
                  return (
                    <div key={task.id} className="p-5 hover:bg-white/[0.03] transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium mb-2 ${task.status === 'done' ? 'text-white/30 line-through' : 'text-white/90'}`}>
                            {task.task}
                          </p>
                          {task.notes && (
                            <p className="text-white/30 text-xs mb-3">{task.notes}</p>
                          )}
                          <div className="flex items-center gap-3 flex-wrap">
                            {ownerMeta?.avatar && (
                              <div className="flex items-center gap-1.5">
                                <img src={ownerMeta.avatar} alt="" className="w-4 h-4 rounded-full" />
                                <span className="text-white/40 text-xs">{ownerMeta.name}</span>
                              </div>
                            )}
                            <span className="text-white/25 text-xs">{task.project}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              task.priority === 'high' ? 'bg-orange-500/15 text-orange-400' :
                              task.priority === 'critical' ? 'bg-red-500/15 text-red-400' :
                              'bg-white/[0.06] text-white/40'
                            }`}>
                              {task.priority}
                            </span>
                          </div>
                        </div>
                        <div>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                            STATUS_COLORS[task.status]?.bg || 'bg-white/5'
                          } ${STATUS_COLORS[task.status]?.text || 'text-white/40'}`}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Blockers (1/3 width) */}
        <div>
          <h2 className="text-white text-2xl font-semibold mb-6">
            Blockers
            {blockers.length > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 text-xs font-bold">
                {blockers.length}
              </span>
            )}
          </h2>
          <div className="bg-white/[0.06] backdrop-blur-xl rounded-2xl border border-white/[0.1] overflow-hidden">
            {blockersLoading ? (
              <div className="p-8 text-center text-white/40 text-sm">Loading...</div>
            ) : blockers.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-emerald-400/60 text-sm font-medium">All clear</p>
                <p className="text-white/20 text-xs mt-1">No blockers</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {blockers.map(b => (
                  <div key={b.id} className="p-5">
                    <p className="text-white/80 text-sm leading-relaxed mb-3">{b.description}</p>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-red-400/70 text-xs">Blocking: {b.blocking_who}</span>
                      {b.needs_input_from && (
                        <span className="text-yellow-400/70 text-xs">Needs: {b.needs_input_from}</span>
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
