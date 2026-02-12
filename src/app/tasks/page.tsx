'use client'
import { useState, useMemo } from 'react'
import AppShell from '@/components/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { useTasks, useBlockers } from '@/lib/hooks'
import { AGENT_MAP, AGENT_COLORS, PROJECTS } from '@/lib/constants'

type Column = 'in_progress' | 'blocked' | 'backlog' | 'done'

const COLUMNS: { key: Column; label: string; icon: string; color: string }[] = [
  { key: 'in_progress', label: 'IN PROGRESS', icon: '▶', color: '#39FF14' },
  { key: 'blocked',     label: 'BLOCKED',     icon: '⛔', color: '#FF2D7B' },
  { key: 'backlog',     label: 'BACKLOG',     icon: '◻', color: '#FFB800' },
  { key: 'done',        label: 'COMPLETED',   icon: '✓', color: '#00D4FF' },
]

export default function TasksPage() {
  const { tasks, loading } = useTasks()
  const { blockers } = useBlockers()
  const [projectFilter, setProjectFilter] = useState<string>('all')

  const filteredTasks = useMemo(() => {
    if (projectFilter === 'all') return tasks
    return tasks.filter(t => t.project === projectFilter)
  }, [tasks, projectFilter])

  const columns = useMemo(() => {
    const cols: Record<Column, typeof tasks> = {
      in_progress: [],
      blocked: [],
      backlog: [],
      done: [],
    }
    filteredTasks.forEach(t => {
      if (t.status === 'in_progress') cols.in_progress.push(t)
      else if (t.status === 'blocked') cols.blocked.push(t)
      else if (t.status === 'backlog' || t.status === 'waiting') cols.backlog.push(t)
      else if (t.status === 'done') cols.done.push(t)
      else cols.backlog.push(t)
    })
    return cols
  }, [filteredTasks])

  // Get blocker descriptions keyed by task_id
  const blockerMap = useMemo(() => {
    const m: Record<string, string> = {}
    blockers.forEach(b => {
      if (b.task_id) m[b.task_id] = b.description
    })
    return m
  }, [blockers])

  const activeProjects = useMemo(() => {
    const projectSet = new Set(tasks.map(t => t.project))
    return PROJECTS.filter(p => projectSet.has(p.id) || projectSet.has(p.name))
  }, [tasks])

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-arcade text-sm text-neon-green text-glow-green mb-2">
            ⚡ MISSION SELECT
          </h1>
          <p className="text-white/30 text-xs font-mono">
            {filteredTasks.length} MISSION{filteredTasks.length !== 1 ? 'S' : ''} LOADED
          </p>
        </div>

        {/* Project Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setProjectFilter('all')}
            className={`
              px-3 py-1.5 rounded text-[10px] font-mono transition-all
              ${projectFilter === 'all'
                ? 'bg-neon-green/10 text-neon-green border border-neon-green/20'
                : 'text-white/30 hover:text-white/50 border border-transparent'
              }
            `}
          >
            ALL
          </button>
          {activeProjects.map(p => (
            <button
              key={p.id}
              onClick={() => setProjectFilter(p.name)}
              className={`
                px-3 py-1.5 rounded text-[10px] font-mono transition-all whitespace-nowrap
                ${projectFilter === p.name
                  ? 'bg-neon-green/10 text-neon-green border border-neon-green/20'
                  : 'text-white/30 hover:text-white/50 border border-transparent'
                }
              `}
            >
              {p.name.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Kanban Board */}
        {loading ? (
          <div className="arcade-card p-12 text-center">
            <p className="font-arcade text-[10px] text-white/20 loading-text">
              LOADING MISSIONS
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {COLUMNS.map(col => (
              <div key={col.key} className="space-y-3">
                {/* Column Header */}
                <div
                  className="flex items-center justify-between px-3 py-2 rounded"
                  style={{
                    backgroundColor: col.color + '08',
                    borderBottom: `2px solid ${col.color}30`,
                  }}
                >
                  <span className="font-arcade text-[8px] tracking-widest" style={{ color: col.color }}>
                    {col.icon} {col.label}
                  </span>
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: col.color + '15',
                      color: col.color,
                    }}
                  >
                    {columns[col.key].length}
                  </span>
                </div>

                {/* Cards */}
                {columns[col.key].length === 0 ? (
                  <div className="arcade-card p-6 text-center">
                    <p className="text-white/15 text-[10px] font-mono">EMPTY</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {columns[col.key].map(task => {
                      const owner = AGENT_MAP[task.owner]
                      const ownerColor = AGENT_COLORS[task.owner]?.neon || '#888'
                      const blocker = blockerMap[task.id]

                      return (
                        <div
                          key={task.id}
                          className="arcade-card p-3 hover:bg-white/[0.02] transition-colors"
                          style={{
                            borderLeftWidth: '2px',
                            borderLeftColor: col.color + '40',
                          }}
                        >
                          <p className={`text-xs font-mono mb-2 leading-relaxed ${
                            col.key === 'done' ? 'text-white/25 line-through' : 'text-white/70'
                          }`}>
                            {task.task}
                          </p>

                          {blocker && col.key === 'blocked' && (
                            <div className="p-2 rounded bg-neon-pink/5 border border-neon-pink/10 mb-2">
                              <p className="text-neon-pink/60 text-[10px] font-mono">{blocker}</p>
                            </div>
                          )}

                          {task.notes && col.key !== 'done' && (
                            <p className="text-white/20 text-[10px] font-mono mb-2 line-clamp-2">
                              {task.notes}
                            </p>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {owner && (
                                <span className="text-[10px] font-mono" style={{ color: ownerColor + 'AA' }}>
                                  {owner.emoji} {owner.name}
                                </span>
                              )}
                            </div>
                            {task.priority && task.priority !== 'medium' && (
                              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                                task.priority === 'critical' ? 'bg-neon-pink/10 text-neon-pink' :
                                task.priority === 'high' ? 'bg-neon-amber/10 text-neon-amber' :
                                'bg-white/5 text-white/25'
                              }`}>
                                {task.priority.toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
