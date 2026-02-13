'use client'
import { useState, useMemo } from 'react'

import { StatusBadge } from '@/components/StatusBadge'
import { useAgentStatus, deriveStatus, useTasks } from '@/lib/hooks'
import { AGENTS, AGENT_COLORS, formatModel } from '@/lib/constants'
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

// Skills per agent (static for v1)
const AGENT_SKILLS: Record<string, string[]> = {
  main: ['github', 'notion', 'weather', 'brave-search', 'claude-code-wingman', 'session-logs'],
  max:  ['github', 'supabase-rls-gen', 'claude-code-wingman', 'deepwiki', 'gemini', 'xai'],
  dash: ['linkedin', 'multi-format-content', 'brave-search', 'tavily', 'supermemory'],
  atlas: ['notion', 'brave-search', 'tavily', 'supermemory'],
  amber: ['brave-search', 'tavily', 'web-search-plus', 'deepwiki', 'supermemory'],
  pixel: ['weather', 'brave-search'],
}

// Projects per agent
const AGENT_PROJECTS: Record<string, string[]> = {
  main: ['System', 'All'],
  max:  ['DO IT', 'Mission Control', 'System'],
  dash: ['Supliful', 'DO IT'],
  atlas: ['Supliful'],
  amber: ['System', 'Research'],
  pixel: ['Pixel'],
}

function StatRow({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-arcade-border last:border-0">
      <span className="text-white/25 text-[10px] font-mono uppercase">{label}</span>
      <span className={`text-[10px] font-mono ${color || 'text-white/60'}`}>{value}</span>
    </div>
  )
}

function AgentCard({ agent, status, taskCount }: {
  agent: typeof AGENTS[0]
  status: AgentStatus | null
  taskCount: number
}) {
  const derived = status ? deriveStatus(status) : 'offline'
  const colors = AGENT_COLORS[agent.id] || AGENT_COLORS.max
  const model = status?.model || null
  const currentTask = status?.current_task || null
  const skills = AGENT_SKILLS[agent.id] || []
  const projects = AGENT_PROJECTS[agent.id] || []

  return (
    <div
      className={`
        arcade-card p-5 transition-all duration-300
        hover:border-opacity-50
      `}
      style={{
        borderColor: derived === 'active' ? colors.neon + '30' : undefined,
        boxShadow: derived === 'active'
          ? `0 0 30px ${colors.neon}15, 0 0 60px ${colors.neon}08`
          : undefined,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-12 h-12 rounded flex items-center justify-center text-2xl"
          style={{
            backgroundColor: colors.neon + '10',
            border: `1px solid ${colors.neon}30`,
          }}
        >
          {agent.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-arcade text-[10px] tracking-wider" style={{ color: colors.neon }}>
              {agent.name.toUpperCase()}
            </h3>
            <StatusBadge status={derived} />
          </div>
          <p className="text-white/30 text-[10px] font-mono mt-0.5">{agent.role}</p>
        </div>
      </div>

      {/* Health Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] font-mono text-white/20">HP</span>
          <span className="text-[9px] font-mono" style={{ color: colors.neon + '80' }}>
            {derived === 'active' ? '100%' : derived === 'idle' ? '50%' : '0%'}
          </span>
        </div>
        <div className="health-bar">
          <div
            className="health-bar-fill"
            style={{
              backgroundColor: colors.neon,
              width: derived === 'active' ? '100%' : derived === 'idle' ? '50%' : '0%',
            }}
          />
        </div>
      </div>

      {/* Current Task */}
      {currentTask && (
        <div
          className="p-3 rounded mb-4 text-xs font-mono leading-relaxed"
          style={{
            backgroundColor: colors.neon + '08',
            borderLeft: `2px solid ${colors.neon}40`,
            color: colors.neon + 'CC',
          }}
        >
          {currentTask}
        </div>
      )}

      {/* Stats */}
      <div className="mb-4">
        <StatRow label="Model" value={formatModel(model)} />
        <StatRow label="Tasks" value={taskCount} />
        <StatRow label="Last Seen" value={status?.last_heartbeat ? timeAgo(status.last_heartbeat) : '—'} />
        <StatRow label="Projects" value={projects.join(', ')} />
      </div>

      {/* Skills / Loadout */}
      <div>
        <span className="text-[9px] font-mono text-white/20 uppercase mb-2 block">LOADOUT</span>
        <div className="flex flex-wrap gap-1">
          {skills.map(skill => (
            <span
              key={skill}
              className="px-1.5 py-0.5 rounded text-[9px] font-mono"
              style={{
                backgroundColor: colors.neon + '10',
                color: colors.neon + '80',
                border: `1px solid ${colors.neon}15`,
              }}
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AgentsTab() {
  const { statuses, loading } = useAgentStatus()
  const { tasks } = useTasks()

  const statusMap = useMemo(() => {
    const m: Record<string, AgentStatus> = {}
    statuses.forEach(s => { m[s.agent_id] = s })
    return m
  }, [statuses])

  const taskCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    tasks.forEach(t => {
      if (t.status !== 'done') {
        counts[t.owner] = (counts[t.owner] || 0) + 1
      }
    })
    return counts
  }, [tasks])

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="font-arcade text-sm text-neon-green text-glow-green mb-2">
            👾 CHARACTER SELECT
          </h1>
          <p className="text-white/30 text-xs font-mono">
            SELECT AN AGENT TO VIEW STATS • LOADOUT • STATUS
          </p>
        </div>

        {loading ? (
          <div className="arcade-card p-12 text-center">
            <p className="font-arcade text-[10px] text-white/20 loading-text">
              LOADING ROSTER
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {AGENTS.map(agent => (
              <AgentCard
                key={agent.id}
                agent={agent}
                status={statusMap[agent.id] || null}
                taskCount={taskCounts[agent.id] || 0}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
