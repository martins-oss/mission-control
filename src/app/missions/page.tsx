'use client'
import { useState, useMemo, useCallback, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import { useQuests, useTasks } from '@/lib/hooks'
import { MISSIONS, AGENT_MAP, AGENT_COLORS, STATUS_COLORS } from '@/lib/constants'
import { supabase, Quest, Task } from '@/lib/supabase'

const QUEST_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  proposed:  { bg: 'bg-blue-500/15',    text: 'text-blue-400' },
  approved:  { bg: 'bg-cyan-500/15',    text: 'text-cyan-400' },
  active:    { bg: 'bg-neon-green/15',   text: 'text-neon-green' },
  paused:    { bg: 'bg-yellow-500/15',  text: 'text-yellow-400' },
  completed: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  cancelled: { bg: 'bg-white/[0.06]',   text: 'text-white/30' },
}

const SIZE_CAPS: Record<string, number> = { S: 5, M: 15, L: 30 }

export default function MissionsPage() {
  const [selectedMission, setSelectedMission] = useState<string | null>(null)
  const [selectedQuest, setSelectedQuest] = useState<string | null>(null)
  const { quests, loading: questsLoading, refresh: refreshQuests } = useQuests(selectedMission || undefined)
  const { tasks, loading: tasksLoading, refresh: refreshTasks } = useTasks()
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const questTasks = useMemo(() => {
    if (!selectedQuest) return []
    return tasks.filter(t => t.quest_id === selectedQuest)
  }, [tasks, selectedQuest])

  const missionTaskCounts = useMemo(() => {
    const counts: Record<string, { active: number; total: number }> = {}
    tasks.forEach(t => {
      const mid = t.mission_id || t.project?.toLowerCase().replace(/\s+/g, '-')
      if (!mid) return
      if (!counts[mid]) counts[mid] = { active: 0, total: 0 }
      counts[mid].total++
      if (t.status === 'in_progress' || t.status === 'backlog' || t.status === 'waiting') counts[mid].active++
    })
    return counts
  }, [tasks])

  const questTaskCounts = useMemo(() => {
    const counts: Record<string, { done: number; total: number }> = {}
    tasks.forEach(t => {
      if (!t.quest_id) return
      if (!counts[t.quest_id]) counts[t.quest_id] = { done: 0, total: 0 }
      counts[t.quest_id].total++
      if (t.status === 'done') counts[t.quest_id].done++
    })
    return counts
  }, [tasks])

  const handleQuestAction = async (questId: string, status: string) => {
    setActionLoading(questId)
    const update: any = { status }
    if (status === 'active' || status === 'approved') {
      update.approved_by = 'martins'
      update.approved_at = new Date().toISOString()
    }
    await supabase.from('quests').update(update).eq('id', questId)
    refreshQuests()
    setActionLoading(null)
  }

  // Breadcrumb navigation
  const breadcrumbs = []
  breadcrumbs.push({ label: 'Missions', onClick: () => { setSelectedMission(null); setSelectedQuest(null) } })
  if (selectedMission) {
    const m = MISSIONS.find(m => m.id === selectedMission)
    breadcrumbs.push({ label: m?.name || selectedMission, onClick: () => setSelectedQuest(null) })
  }
  if (selectedQuest) {
    const q = quests.find(q => q.id === selectedQuest)
    breadcrumbs.push({ label: q?.title || 'Quest', onClick: () => {} })
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-mono">
          {breadcrumbs.map((bc, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-white/15">›</span>}
              <button
                onClick={bc.onClick}
                className={`${i === breadcrumbs.length - 1 ? 'text-neon-green' : 'text-white/40 hover:text-white/70'} transition-colors`}
              >
                {bc.label}
              </button>
            </span>
          ))}
        </div>

        {/* Level 1: Mission List */}
        {!selectedMission && (
          <>
            <div>
              <h1 className="font-arcade text-sm text-neon-green text-glow-green mb-2">⚡ MISSIONS</h1>
              <p className="text-white/30 text-xs font-mono">{MISSIONS.length} MISSIONS ACTIVE</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {MISSIONS.map(mission => {
                const owner = AGENT_MAP[mission.owner]
                const color = AGENT_COLORS[mission.owner]?.neon || '#39FF14'
                const tc = missionTaskCounts[mission.id] || { active: 0, total: 0 }
                const missionQuests = quests.filter(q => q.mission_id === mission.id)
                const activeQuests = missionQuests.filter(q => q.status === 'active' || q.status === 'approved')

                return (
                  <button
                    key={mission.id}
                    onClick={() => setSelectedMission(mission.id)}
                    className="arcade-card p-5 text-left hover:border-opacity-50 transition-all group"
                    style={{ borderColor: color + '20' }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded flex items-center justify-center text-lg"
                        style={{ backgroundColor: color + '10', border: `1px solid ${color}30` }}
                      >
                        {owner?.emoji || '📁'}
                      </div>
                      <div>
                        <h3 className="font-arcade text-[10px] tracking-wider group-hover:brightness-125" style={{ color }}>
                          {mission.name.toUpperCase()}
                        </h3>
                        <p className="text-white/30 text-[10px] font-mono">{mission.description}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                      <div>
                        <span className="text-white/20 block">QUESTS</span>
                        <span className="text-white/60">{activeQuests.length}</span>
                      </div>
                      <div>
                        <span className="text-white/20 block">TASKS</span>
                        <span className="text-white/60">{tc.active}</span>
                      </div>
                      <div>
                        <span className="text-white/20 block">OWNER</span>
                        <span style={{ color: color + '80' }}>{owner?.name || mission.owner}</span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {/* Level 2: Quest List */}
        {selectedMission && !selectedQuest && (
          <>
            <div>
              <h1 className="font-arcade text-sm text-neon-green text-glow-green mb-2">
                {MISSIONS.find(m => m.id === selectedMission)?.name.toUpperCase()} — QUESTS
              </h1>
              <p className="text-white/30 text-xs font-mono">
                {quests.filter(q => q.status === 'active').length} ACTIVE · {quests.length} TOTAL
              </p>
            </div>

            {questsLoading ? (
              <div className="arcade-card p-12 text-center">
                <p className="font-arcade text-[10px] text-white/20 loading-text">LOADING QUESTS</p>
              </div>
            ) : quests.length === 0 ? (
              <div className="arcade-card p-12 text-center">
                <p className="font-arcade text-[10px] text-white/20">NO QUESTS YET</p>
                <p className="text-white/10 text-xs font-mono mt-2">PROPOSE A QUEST TO BEGIN</p>
              </div>
            ) : (
              <div className="space-y-3">
                {quests.map(quest => {
                  const tc = questTaskCounts[quest.id] || { done: 0, total: 0 }
                  const cap = SIZE_CAPS[quest.size] || 15
                  const ownerMeta = quest.owner ? AGENT_MAP[quest.owner] : null
                  const colors = QUEST_STATUS_COLORS[quest.status] || QUEST_STATUS_COLORS.proposed
                  const atCeiling = tc.total >= cap

                  return (
                    <button
                      key={quest.id}
                      onClick={() => setSelectedQuest(quest.id)}
                      className="arcade-card p-5 w-full text-left hover:border-neon-green/20 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-white/80 text-sm font-medium">{quest.title}</h3>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase ${colors.bg} ${colors.text}`}>
                              {quest.status}
                            </span>
                            <span className="text-white/20 text-[9px] font-mono">
                              {quest.size}
                            </span>
                          </div>
                          {quest.description && (
                            <p className="text-white/30 text-xs font-mono">{quest.description}</p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <span className={`text-xs font-mono ${atCeiling ? 'text-red-400' : 'text-white/40'}`}>
                            {tc.done}/{tc.total}
                            <span className="text-white/15"> /{cap}</span>
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="health-bar mb-3">
                        <div
                          className="health-bar-fill"
                          style={{
                            width: tc.total > 0 ? `${(tc.done / tc.total) * 100}%` : '0%',
                            backgroundColor: '#39FF14',
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {ownerMeta && (
                            <span className="text-white/30 text-[10px] font-mono">
                              {ownerMeta.emoji} {ownerMeta.name}
                            </span>
                          )}
                        </div>
                        {/* Actions */}
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          {quest.status === 'proposed' && (
                            <button
                              onClick={() => handleQuestAction(quest.id, 'active')}
                              disabled={actionLoading === quest.id}
                              className="px-3 py-1 rounded bg-neon-green/10 text-neon-green text-[10px] font-mono border border-neon-green/20 hover:bg-neon-green/20 transition-colors disabled:opacity-50"
                            >
                              APPROVE
                            </button>
                          )}
                          {(quest.status === 'active' || quest.status === 'approved') && (
                            <>
                              <button
                                onClick={() => handleQuestAction(quest.id, 'paused')}
                                disabled={actionLoading === quest.id}
                                className="px-3 py-1 rounded bg-yellow-500/10 text-yellow-400 text-[10px] font-mono border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors disabled:opacity-50"
                              >
                                PAUSE
                              </button>
                              <button
                                onClick={() => handleQuestAction(quest.id, 'completed')}
                                disabled={actionLoading === quest.id}
                                className="px-3 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                              >
                                COMPLETE
                              </button>
                            </>
                          )}
                          {quest.status === 'paused' && (
                            <button
                              onClick={() => handleQuestAction(quest.id, 'active')}
                              disabled={actionLoading === quest.id}
                              className="px-3 py-1 rounded bg-neon-green/10 text-neon-green text-[10px] font-mono border border-neon-green/20 hover:bg-neon-green/20 transition-colors disabled:opacity-50"
                            >
                              RESUME
                            </button>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* Level 3: Task List */}
        {selectedQuest && (
          <>
            <div>
              <h1 className="font-arcade text-sm text-neon-green text-glow-green mb-2">
                {quests.find(q => q.id === selectedQuest)?.title.toUpperCase() || 'TASKS'}
              </h1>
              <p className="text-white/30 text-xs font-mono">
                {questTasks.filter(t => t.status === 'done').length}/{questTasks.length} COMPLETE
              </p>
            </div>

            {tasksLoading ? (
              <div className="arcade-card p-12 text-center">
                <p className="font-arcade text-[10px] text-white/20 loading-text">LOADING TASKS</p>
              </div>
            ) : questTasks.length === 0 ? (
              <div className="arcade-card p-12 text-center">
                <p className="font-arcade text-[10px] text-white/20">NO TASKS IN THIS QUEST</p>
              </div>
            ) : (
              <div className="arcade-card divide-y divide-arcade-border">
                {questTasks.map(task => {
                  const ownerMeta = AGENT_MAP[task.owner]
                  const ownerColor = AGENT_COLORS[task.owner]?.neon || '#888'
                  const isDone = task.status === 'done'

                  return (
                    <div key={task.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-5 h-5 rounded border-2 mt-0.5 flex items-center justify-center flex-shrink-0 ${
                            isDone ? 'border-neon-green/50 bg-neon-green/10' : 'border-white/15'
                          }`}
                        >
                          {isDone && <span className="text-neon-green text-[10px]">✓</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-mono ${isDone ? 'text-white/30 line-through' : 'text-white/70'}`}>
                            {task.task}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            {ownerMeta && (
                              <span className="text-[10px] font-mono" style={{ color: ownerColor + '80' }}>
                                {ownerMeta.emoji} {ownerMeta.name}
                              </span>
                            )}
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${
                              STATUS_COLORS[task.status]?.bg || 'bg-white/5'
                            } ${STATUS_COLORS[task.status]?.text || 'text-white/40'}`}>
                              {task.status.replace('_', ' ')}
                            </span>
                            {task.priority && task.priority !== 'medium' && (
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${
                                task.priority === 'high' || task.priority === 'critical' ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-white/30'
                              }`}>
                                {task.priority}
                              </span>
                            )}
                          </div>
                          {task.notes && (
                            <p className="text-white/20 text-[10px] font-mono mt-1">{task.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
