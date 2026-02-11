'use client'
import { useMemo, useState } from 'react'
import AppShell from '@/components/AppShell'
import { useAgentStatus, deriveStatus, useTasks, useBlockers } from '@/lib/hooks'
import { AGENTS, AGENT_MAP, STATUS_COLORS, PROJECTS, formatModel } from '@/lib/constants'
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
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} ${status === 'active' ? 'animate-pulse' : ''}`} />
      {status}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    critical: 'bg-red-500/15 text-red-400',
    high: 'bg-orange-500/15 text-orange-400',
    medium: 'bg-white/[0.08] text-white/60',
    low: 'bg-white/[0.06] text-white/40',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[priority] || colors.medium}`}>
      {priority}
    </span>
  )
}

function TaskStatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.idle
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${colors.bg} ${colors.text}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

function OwnerBadge({ owner }: { owner: string }) {
  const meta = AGENT_MAP[owner]
  if (!meta) return <span className="text-white/60 text-xs">{owner}</span>
  return (
    <span className="inline-flex items-center gap-1.5 text-white/60 text-xs">
      {meta.avatar ? (
        <img src={meta.avatar} alt={meta.name} className="w-4 h-4 rounded-full" />
      ) : (
        <span>{meta.emoji}</span>
      )}
      {meta.name}
    </span>
  )
}

function getAgentStatusFromTasks(agentId: string, tasks: Task[]): string {
  const agentTasks = tasks.filter(t => t.owner === agentId)
  if (agentTasks.some(t => t.status === 'blocked')) return 'error'
  if (agentTasks.some(t => t.status === 'in_progress')) return 'active'
  if (agentTasks.some(t => t.status === 'backlog' || t.status === 'waiting')) return 'idle'
  return 'idle' // All agents have heartbeats, never truly offline
}

// ─── Kanban View ────────────────────────────────────────────

const KANBAN_COLUMNS = [
  { key: 'backlog', label: 'Backlog', statuses: ['backlog', 'waiting'] },
  { key: 'in_progress', label: 'In Progress', statuses: ['in_progress'] },
  { key: 'blocked', label: 'Blocked', statuses: ['blocked'] },
  { key: 'done', label: 'Done', statuses: ['done'] },
]

function KanbanView({ tasks }: { tasks: Task[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {KANBAN_COLUMNS.map(col => {
        const colTasks = tasks.filter(t => col.statuses.includes(t.status))
        const colColor = col.key === 'blocked' ? 'border-red-500/20' :
                         col.key === 'in_progress' ? 'border-emerald-500/20' :
                         col.key === 'done' ? 'border-emerald-500/10' : 'border-white/[0.08]'
        return (
          <div key={col.key} className="min-h-[200px]">
            <div className={`flex items-center gap-2 mb-3 pb-2 border-b-2 ${colColor}`}>
              <h3 className="text-white/60 text-xs uppercase tracking-wider font-medium">{col.label}</h3>
              <span className="text-white/30 text-[10px]">{colTasks.length}</span>
            </div>
            <div className="space-y-2">
              {colTasks.map(task => (
                <div
                  key={task.id}
                  className="bg-white/[0.04] backdrop-blur-sm rounded-lg p-3 border border-white/[0.06] hover:border-white/[0.12] transition-colors"
                >
                  <p className={`text-sm font-medium mb-2 ${task.status === 'done' ? 'text-white/40 line-through' : 'text-white/90'}`}>
                    {task.task}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <OwnerBadge owner={task.owner} />
                    <div className="flex items-center gap-1.5">
                      <span className="text-white/30 text-[10px]">{task.project}</span>
                      <PriorityBadge priority={task.priority} />
                    </div>
                  </div>
                </div>
              ))}
              {colTasks.length === 0 && (
                <p className="text-white/20 text-xs text-center py-6">No tasks</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Dashboard ─────────────────────────────────────────

type TaskView = 'table' | 'kanban'

export default function Dashboard() {
  const { statuses, loading: statusLoading } = useAgentStatus()
  const { tasks, loading: tasksLoading } = useTasks()
  const { blockers, loading: blockersLoading } = useBlockers()
  const [taskView, setTaskView] = useState<TaskView>('table')

  const statusMap = useMemo(() => {
    const m: Record<string, AgentStatus> = {}
    statuses.forEach(s => { m[s.agent_id] = s })
    return m
  }, [statuses])

  const stats = useMemo(() => {
    const active = tasks.filter(t => t.status === 'in_progress').length
    const blocked = tasks.filter(t => t.status === 'blocked').length
    const backlog = tasks.filter(t => t.status === 'backlog' || t.status === 'waiting').length
    const total = tasks.length
    return { active, blocked, backlog, total }
  }, [tasks])

  return (
    <AppShell>
      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'In Progress', value: stats.active, color: 'text-emerald-400' },
          { label: 'Blocked', value: stats.blocked, color: stats.blocked > 0 ? 'text-red-400' : 'text-white/40' },
          { label: 'Backlog', value: stats.backlog, color: 'text-white/60' },
          { label: 'Total Tasks', value: stats.total, color: 'text-white' },
        ].map(s => (
          <div key={s.label} className="bg-white/[0.06] backdrop-blur-xl rounded-xl p-4 border border-white/[0.1]">
            <p className="text-white/50 text-[10px] uppercase tracking-wider font-medium">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{tasksLoading ? '—' : s.value}</p>
          </div>
        ))}
      </div>

      {/* Agent Status Cards */}
      <div className="mb-8">
        <h2 className="text-white/50 text-[10px] uppercase tracking-wider font-medium mb-3">Agents</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {AGENTS.map(agent => {
            const agentStatus = statusMap[agent.id]
            const derivedFromHeartbeat = agentStatus ? deriveStatus(agentStatus) : null
            const derivedFromTasks = getAgentStatusFromTasks(agent.id, tasks)
            // Use heartbeat status if available, otherwise derive from tasks
            const status = derivedFromHeartbeat || derivedFromTasks
            const currentTask = agentStatus?.current_task ||
              tasks.find(t => t.owner === agent.id && t.status === 'in_progress')?.task || null
            const agentTaskCount = tasks.filter(t => t.owner === agent.id && t.status !== 'done').length
            const lastSeen = agentStatus?.last_heartbeat ? timeAgo(agentStatus.last_heartbeat) : null
            const model = agentStatus?.model || null

            return (
              <div key={agent.id} className="bg-white/[0.06] backdrop-blur-xl rounded-xl p-4 border border-white/[0.1] hover:border-emerald-500/20 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <img
                    src={agent.avatar}
                    alt={agent.name}
                    className="w-10 h-10 rounded-full ring-2 ring-white/[0.08] group-hover:ring-emerald-500/30 transition-all"
                  />
                  <StatusBadge status={status} />
                </div>
                <h3 className="text-white font-semibold text-sm">{agent.name}</h3>
                <p className="text-white/50 text-xs">{agent.role}</p>
                <p className="text-white/30 text-[10px] mt-0.5 font-mono">{formatModel(model)}</p>
                <div className="mt-2 pt-2 border-t border-white/[0.06]">
                  {currentTask ? (
                    <p className="text-emerald-400/70 text-xs line-clamp-2 leading-relaxed">{currentTask}</p>
                  ) : agentTaskCount > 0 ? (
                    <p className="text-white/40 text-xs">{agentTaskCount} task{agentTaskCount > 1 ? 's' : ''} queued</p>
                  ) : (
                    <p className="text-white/25 text-xs">No tasks</p>
                  )}
                </div>
                {lastSeen && (
                  <p className="text-white/30 text-[10px] mt-2">Last seen {lastSeen}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Main Content: Tasks + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Tracker */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white/50 text-[10px] uppercase tracking-wider font-medium">Tasks</h2>
            <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-0.5">
              <button
                onClick={() => setTaskView('table')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  taskView === 'table' ? 'bg-white/[0.08] text-white/80' : 'text-white/30 hover:text-white/50'
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setTaskView('kanban')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  taskView === 'kanban' ? 'bg-white/[0.08] text-white/80' : 'text-white/30 hover:text-white/50'
                }`}
              >
                Kanban
              </button>
            </div>
          </div>

          {tasksLoading ? (
            <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-8 text-center text-white/50 text-sm">Loading tasks...</div>
          ) : taskView === 'kanban' ? (
            <KanbanView tasks={tasks} />
          ) : (
            <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] overflow-hidden">
              {tasks.length === 0 ? (
                <div className="p-8 text-center text-white/50 text-sm">No tasks</div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  <div className="grid grid-cols-12 gap-2 px-4 py-2.5 text-white/40 text-[10px] uppercase tracking-wider font-medium bg-white/[0.02]">
                    <div className="col-span-5">Task</div>
                    <div className="col-span-2 hidden sm:block">Project</div>
                    <div className="col-span-2">Owner</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-1 text-right hidden sm:block">Pri</div>
                  </div>
                  {tasks.map(task => (
                    <div key={task.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-white/[0.02] transition-colors">
                      <div className="col-span-5">
                        <p className={`text-sm ${task.status === 'done' ? 'text-white/30 line-through' : 'text-white/90'}`}>
                          {task.task}
                        </p>
                        {task.notes && (
                          <p className="text-white/30 text-[11px] mt-0.5 line-clamp-1">{task.notes}</p>
                        )}
                      </div>
                      <div className="col-span-2 hidden sm:block">
                        <span className="text-white/40 text-xs">{task.project}</span>
                      </div>
                      <div className="col-span-2">
                        <OwnerBadge owner={task.owner} />
                      </div>
                      <div className="col-span-2">
                        <TaskStatusBadge status={task.status} />
                      </div>
                      <div className="col-span-1 text-right hidden sm:block">
                        <PriorityBadge priority={task.priority} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Blockers */}
          <div>
            <h2 className="text-white/50 text-[10px] uppercase tracking-wider font-medium mb-3">
              Blockers
              {blockers.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 text-[10px]">
                  {blockers.length}
                </span>
              )}
            </h2>
            <div className="bg-white/[0.06] backdrop-blur-xl rounded-xl border border-white/[0.1] overflow-hidden">
              {blockersLoading ? (
                <div className="p-6 text-center text-white/50 text-sm">Loading...</div>
              ) : blockers.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-emerald-400/60 text-sm">All clear</p>
                  <p className="text-white/30 text-xs mt-1">No active blockers</p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.06]">
                  {blockers.map(b => (
                    <div key={b.id} className="p-4">
                      <p className="text-white/80 text-sm">{b.description}</p>
                      <div className="flex items-center gap-2 mt-2">
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

          {/* Projects */}
          <div>
            <h2 className="text-white/50 text-[10px] uppercase tracking-wider font-medium mb-3">Projects</h2>
            <div className="space-y-2">
              {PROJECTS.map(p => {
                const projectTasks = tasks.filter(t => t.project === p.name)
                const done = projectTasks.filter(t => t.status === 'done').length
                const total = projectTasks.length
                const progress = total > 0 ? (done / total) * 100 : 0

                return (
                  <div key={p.id} className="bg-white/[0.06] backdrop-blur-xl rounded-xl p-4 border border-white/[0.1]">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-white font-medium text-sm">{p.name}</h3>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="text-white/40 text-xs mb-3">{p.description}</p>
                    {total > 0 && (
                      <div>
                        <div className="flex justify-between text-[10px] text-white/40 mb-1">
                          <span>{done}/{total} tasks</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-white/[0.06] rounded-full h-1">
                          <div
                            className="bg-emerald-500/60 h-1 rounded-full transition-all"
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
    </AppShell>
  )
}
