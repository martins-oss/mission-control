"use client"
import { useMemo, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { useTasks, useBlockers, useLinkedInPosts, useLinkedInAuth } from '@/lib/hooks'
import { AGENTS, AGENT_MAP, STATUS_COLORS, PROJECTS } from '@/lib/constants'
import type { Task, LinkedInPost } from '@/lib/supabase'

type Tab = 'dashboard' | 'linkedin'

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
  const { posts, loading: postsLoading, refresh: refreshPosts } = useLinkedInPosts()
  const { auth: linkedInAuth, loading: authLinkedInLoading } = useLinkedInAuth()
  const [tab, setTab] = useState<Tab>('dashboard')

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

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white/[0.04] rounded-lg p-1 w-fit">
          {[
            { key: 'dashboard' as Tab, label: 'Dashboard' },
            { key: 'linkedin' as Tab, label: 'LinkedIn' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/40 hover:text-white/60'
              }`}
            >
              {t.label}
              {t.key === 'linkedin' && posts.filter(p => p.status === 'draft').length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-400 text-[10px]">
                  {posts.filter(p => p.status === 'draft').length}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === 'linkedin' ? (
          <LinkedInView
            posts={posts}
            loading={postsLoading}
            auth={linkedInAuth}
            authLoading={authLinkedInLoading}
            onRefresh={refreshPosts}
          />
        ) : (
        <>
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
        </>
        )}
      </div>
    </main>
  )
}

// ─── LinkedIn View ─────────────────────────────────────────

interface LinkedInViewProps {
  posts: LinkedInPost[]
  loading: boolean
  auth: any
  authLoading: boolean
  onRefresh: () => void
}

const LI_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  draft:     { bg: 'bg-yellow-500/15', text: 'text-yellow-400' },
  approved:  { bg: 'bg-blue-500/15',   text: 'text-blue-400' },
  scheduled: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  posted:    { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  failed:    { bg: 'bg-red-500/15',     text: 'text-red-400' },
}

function LinkedInView({ posts, loading, auth, authLoading, onRefresh }: LinkedInViewProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [scheduleFor, setScheduleFor] = useState<Record<string, string>>({})

  const isConnected = auth && new Date(auth.expires_at) > new Date()

  const handleAction = async (postId: string, updates: Record<string, any>) => {
    setActionLoading(postId)
    try {
      await fetch('/api/linkedin/posts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postId, ...updates }),
      })
      onRefresh()
    } catch (err) {
      console.error('Action failed:', err)
    }
    setActionLoading(null)
  }

  const handlePublishNow = async (postId: string) => {
    setActionLoading(postId)
    try {
      const res = await fetch('/api/linkedin/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      })
      const data = await res.json()
      if (!data.success) {
        alert(`Failed: ${data.error}`)
      }
      onRefresh()
    } catch (err) {
      console.error('Publish failed:', err)
    }
    setActionLoading(null)
  }

  const drafts = posts.filter(p => p.status === 'draft')
  const scheduled = posts.filter(p => p.status === 'approved' || p.status === 'scheduled')
  const history = posts.filter(p => p.status === 'posted' || p.status === 'failed')

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06] flex items-center justify-between">
        <div>
          <h3 className="text-white font-medium text-sm">LinkedIn Connection</h3>
          <p className="text-white/30 text-xs mt-0.5">
            {authLoading ? 'Checking...' : isConnected ? `Connected — expires ${new Date(auth.expires_at).toLocaleDateString()}` : 'Not connected'}
          </p>
        </div>
        <a
          href="/api/linkedin/authorize"
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isConnected
              ? 'bg-white/[0.06] text-white/40 hover:text-white'
              : 'bg-emerald-500 text-black hover:bg-emerald-400'
          }`}
        >
          {isConnected ? 'Reconnect' : 'Connect LinkedIn'}
        </a>
      </div>

      {/* Drafts for Review */}
      {drafts.length > 0 && (
        <div>
          <h2 className="text-white/50 text-xs uppercase tracking-wider mb-3">
            Drafts for Review
            <span className="ml-2 px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-400 text-[10px]">{drafts.length}</span>
          </h2>
          <div className="space-y-3">
            {drafts.map(post => (
              <div key={post.id} className="bg-white/[0.04] rounded-xl p-5 border border-white/[0.06]">
                {post.title && <h3 className="text-white font-medium text-sm mb-1">{post.title}</h3>}
                <p className="text-white/70 text-sm whitespace-pre-wrap mb-4">{post.content}</p>
                {post.media_url && (
                  <p className="text-blue-400 text-xs mb-3">🔗 {post.media_url}</p>
                )}
                <div className="flex items-center gap-2 text-xs text-white/30 mb-4">
                  <span>By {AGENT_MAP[post.author]?.emoji || ''} {AGENT_MAP[post.author]?.name || post.author}</span>
                  <span>·</span>
                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAction(post.id, { status: 'approved', approved_by: 'martin', approved_at: new Date().toISOString() })}
                    disabled={actionLoading === post.id}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                  >
                    ✓ Approve
                  </button>
                  <div className="flex items-center gap-1">
                    <input
                      type="datetime-local"
                      value={scheduleFor[post.id] || ''}
                      onChange={e => setScheduleFor(prev => ({ ...prev, [post.id]: e.target.value }))}
                      className="bg-white/[0.06] border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-500/50"
                    />
                    <button
                      onClick={() => {
                        const dt = scheduleFor[post.id]
                        if (!dt) return alert('Pick a time first')
                        handleAction(post.id, {
                          status: 'scheduled',
                          scheduled_at: new Date(dt).toISOString(),
                          approved_by: 'martin',
                          approved_at: new Date().toISOString(),
                        })
                      }}
                      disabled={actionLoading === post.id || !scheduleFor[post.id]}
                      className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-sm font-medium hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                    >
                      Schedule
                    </button>
                  </div>
                  <button
                    onClick={() => handleAction(post.id, { status: 'failed', error: 'Rejected by reviewer' })}
                    disabled={actionLoading === post.id}
                    className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400/60 text-sm hover:bg-red-500/20 transition-colors disabled:opacity-50 ml-auto"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scheduled / Approved */}
      {scheduled.length > 0 && (
        <div>
          <h2 className="text-white/50 text-xs uppercase tracking-wider mb-3">Upcoming</h2>
          <div className="space-y-2">
            {scheduled.map(post => (
              <div key={post.id} className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06] flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-white/70 text-sm line-clamp-2">{post.content}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-white/30">
                    {post.scheduled_at && (
                      <span className="text-blue-400">📅 {new Date(post.scheduled_at).toLocaleString()}</span>
                    )}
                    <span className={`px-1.5 py-0.5 rounded ${LI_STATUS_COLORS[post.status]?.bg} ${LI_STATUS_COLORS[post.status]?.text}`}>
                      {post.status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handlePublishNow(post.id)}
                  disabled={actionLoading === post.id || !isConnected}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  Post Now
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      <div>
        <h2 className="text-white/50 text-xs uppercase tracking-wider mb-3">Post History</h2>
        <div className="bg-white/[0.04] rounded-xl border border-white/[0.06] overflow-hidden">
          {loading ? (
            <div className="p-6 text-center text-white/30 text-sm">Loading...</div>
          ) : history.length === 0 ? (
            <div className="p-6 text-center text-white/30 text-sm">No posts yet</div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {history.map(post => (
                <div key={post.id} className="p-4 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white/60 text-sm line-clamp-1">{post.content}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-white/25">
                      {post.posted_at && <span>{new Date(post.posted_at).toLocaleString()}</span>}
                      {post.error && <span className="text-red-400">{post.error.slice(0, 60)}</span>}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs whitespace-nowrap ${LI_STATUS_COLORS[post.status]?.bg} ${LI_STATUS_COLORS[post.status]?.text}`}>
                    {post.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Empty State */}
      {!loading && posts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-white/30 text-sm">No LinkedIn posts yet.</p>
          <p className="text-white/20 text-xs mt-1">Dash will create drafts for you to review.</p>
        </div>
      )}
    </div>
  )
}
