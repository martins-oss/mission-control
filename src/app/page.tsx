"use client"
import { useMemo } from 'react'
import { useAuth } from '@/lib/auth'
import { useTasks, useBlockers } from '@/lib/hooks'
import { AGENTS, AGENT_MAP, STATUS_COLORS, PROJECTS } from '@/lib/constants'
import type { Task } from '@/lib/supabase'

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.offline
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} ${status === 'active' || status === 'in_progress' ? 'animate-pulse' : ''}`} />
      {status.replace('_', ' ')}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    critical: 'bg-red-500/15 text-red-400',
    high: 'bg-orange-500/15 text-orange-400',
    medium: 'bg-white/5 text-white/50',
    low: 'bg-white/5 text-white/30',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[priority] || colors.medium}`}>
      {priority}
    </span>
  )
}

function getAgentStatus(agentId: string, tasks: Task[]): string {
  const agentTasks = tasks.filter(t => t.owner === agentId)
  if (agentTasks.some(t => t.status === 'blocked')) return 'error'
  if (agentTasks.some(t => t.status === 'in_progress')) return 'active'
  if (agentTasks.length > 0) return 'idle'
  return 'offline'
}

function getAgentCurrentTask(agentId: string, tasks: Task[]): string | null {
  const active = tasks.find(t => t.owner === agentId && t.status === 'in_progress')
  return active?.task || null
}

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth(true)
  const { tasks, loading: tasksLoading } = useTasks()
  const { blockers, loading: blockersLoading } = useBlockers()

  const stats = useMemo(() => {
    const active = tasks.filter(t => t.status === 'in_progress').length
    const blocked = tasks.filter(t => t.status === 'blocked').length
    const done = tasks.filter(t => t.status === 'done').length
    const total = tasks.length
    return { active, blocked, done, total }
  }, [tasks])

  if (authLoading) {
    return (
      <main className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-white/40">Loading...</div>
      </main>
    )
  }

  if (!user) return null

  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Mission Control</h1>
            <p className="text-white/40 text-sm mt-0.5">Team dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-white/40 text-sm hidden sm:block">{user.email}</span>
            <button onClick={signOut} className="text-white/30 hover:text-white text-sm transition-colors">
              Sign out
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'In Progress', value: stats.active, color: 'text-emerald-400' },
            { label: 'Blocked', value: stats.blocked, color: 'text-red-400' },
            { label: 'Done', value: stats.done, color: 'text-white/60' },
            { label: 'Total Tasks', value: stats.total, color: 'text-white' },
          ].map(s => (
            <div key={s.label} className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
              <p className="text-white/40 text-xs uppercase tracking-wider">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{tasksLoading ? '—' : s.value}</p>
            </div>
          ))}
        </div>

        {/* Agent Status Cards */}
        <div className="mb-8">
          <h2 className="text-white/50 text-xs uppercase tracking-wider mb-3">Agents</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {AGENTS.map(agent => {
              const status = getAgentStatus(agent.id, tasks)
              const currentTask = getAgentCurrentTask(agent.id, tasks)
              const agentTaskCount = tasks.filter(t => t.owner === agent.id && t.status !== 'done').length

              return (
                <div key={agent.id} className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06] hover:border-white/[0.12] transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-2xl">{agent.emoji}</span>
                    <StatusBadge status={status} />
                  </div>
                  <h3 className="text-white font-semibold text-sm">{agent.name}</h3>
                  <p className="text-white/30 text-xs">{agent.role}</p>
                  {currentTask && (
                    <p className="text-white/50 text-xs mt-2 line-clamp-2">{currentTask}</p>
                  )}
                  {agentTaskCount > 0 && (
                    <p className="text-white/25 text-[10px] mt-1">{agentTaskCount} task{agentTaskCount > 1 ? 's' : ''}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Main Content: Tasks + Blockers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Task Tracker */}
          <div className="lg:col-span-2">
            <h2 className="text-white/50 text-xs uppercase tracking-wider mb-3">Tasks</h2>
            <div className="bg-white/[0.04] rounded-xl border border-white/[0.06] overflow-hidden">
              {tasksLoading ? (
                <div className="p-8 text-center text-white/30">Loading tasks...</div>
              ) : tasks.length === 0 ? (
                <div className="p-8 text-center text-white/30">No tasks yet</div>
              ) : (
                <div className="divide-y divide-white/[0.06]">
                  {/* Header */}
                  <div className="grid grid-cols-12 gap-2 px-4 py-2 text-white/30 text-xs uppercase tracking-wider">
                    <div className="col-span-4 sm:col-span-5">Task</div>
                    <div className="col-span-2 hidden sm:block">Project</div>
                    <div className="col-span-2">Owner</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2 sm:col-span-1 text-right">Priority</div>
                  </div>
                  {tasks.map(task => {
                    const ownerMeta = AGENT_MAP[task.owner]
                    return (
                      <div key={task.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-white/[0.02] transition-colors">
                        <div className="col-span-4 sm:col-span-5">
                          <p className={`text-sm font-medium ${task.status === 'done' ? 'text-white/30 line-through' : 'text-white'}`}>
                            {task.task}
                          </p>
                          {task.notes && (
                            <p className="text-white/25 text-xs mt-0.5 line-clamp-1">{task.notes}</p>
                          )}
                        </div>
                        <div className="col-span-2 hidden sm:block">
                          <span className="text-white/40 text-xs">{task.project}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-white/60 text-xs">
                            {ownerMeta ? `${ownerMeta.emoji} ${ownerMeta.name}` : task.owner}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <StatusBadge status={task.status} />
                        </div>
                        <div className="col-span-2 sm:col-span-1 text-right">
                          <PriorityBadge priority={task.priority} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar: Blockers + Projects */}
          <div className="space-y-6">
            {/* Blockers */}
            <div>
              <h2 className="text-white/50 text-xs uppercase tracking-wider mb-3">
                Blockers
                {blockers.length > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 text-[10px]">
                    {blockers.length}
                  </span>
                )}
              </h2>
              <div className="bg-white/[0.04] rounded-xl border border-white/[0.06] overflow-hidden">
                {blockersLoading ? (
                  <div className="p-6 text-center text-white/30 text-sm">Loading...</div>
                ) : blockers.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-emerald-400/60 text-sm">✓ No blockers</p>
                    <p className="text-white/20 text-xs mt-1">All clear</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.06]">
                    {blockers.map(b => (
                      <div key={b.id} className="p-4">
                        <p className="text-white text-sm">{b.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-red-400 text-xs">Blocking: {b.blocking_who}</span>
                          {b.needs_input_from && (
                            <span className="text-yellow-400 text-xs">Needs: {b.needs_input_from}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Projects */}
            <div>
              <h2 className="text-white/50 text-xs uppercase tracking-wider mb-3">Projects</h2>
              <div className="space-y-2">
                {PROJECTS.map(p => {
                  const projectTasks = tasks.filter(t => t.project === p.name)
                  const done = projectTasks.filter(t => t.status === 'done').length
                  const total = projectTasks.length
                  const progress = total > 0 ? (done / total) * 100 : 0

                  return (
                    <div key={p.id} className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-white font-medium text-sm">{p.name}</h3>
                        <StatusBadge status={p.status} />
                      </div>
                      <p className="text-white/30 text-xs mb-3">{p.description}</p>
                      {total > 0 && (
                        <div>
                          <div className="flex justify-between text-xs text-white/30 mb-1">
                            <span>{done}/{total} tasks</span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <div className="w-full bg-white/[0.06] rounded-full h-1.5">
                            <div
                              className="bg-emerald-400 h-1.5 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
