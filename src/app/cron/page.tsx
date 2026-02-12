'use client'
import { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import { AGENT_MAP } from '@/lib/constants'

interface CronJob {
  id: string
  agentId: string
  name: string
  enabled: boolean
  schedule: {
    kind: string
    expr?: string
    everyMs?: number
    at?: string
    tz?: string
  }
  state?: {
    nextRunAtMs?: number
    lastRunAtMs?: number
    lastStatus?: string
    lastDurationMs?: number
  }
  createdAtMs: number
  updatedAtMs: number
  sessionTarget: string
  payload: {
    kind: string
    message?: string
    model?: string
  }
}

interface CronResponse {
  jobs: CronJob[]
}

function formatSchedule(schedule: CronJob['schedule']): string {
  if (schedule.kind === 'cron' && schedule.expr) {
    return `Cron: ${schedule.expr} (${schedule.tz || 'UTC'})`
  }
  if (schedule.kind === 'every' && schedule.everyMs) {
    const hours = schedule.everyMs / (1000 * 60 * 60)
    const minutes = schedule.everyMs / (1000 * 60)
    if (hours >= 1) return `Every ${hours}h`
    return `Every ${minutes}m`
  }
  if (schedule.kind === 'at' && schedule.at) {
    return `At ${new Date(schedule.at).toLocaleString()}`
  }
  return 'Unknown schedule'
}

function formatTime(ms?: number): string {
  if (!ms) return 'Never'
  const date = new Date(ms)
  const now = Date.now()
  const diff = ms - now
  
  if (diff > 0) {
    // Future time
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  } else {
    // Past time
    const ago = now - ms
    const hours = Math.floor(ago / (1000 * 60 * 60))
    const minutes = Math.floor((ago % (1000 * 60 * 60)) / (1000 * 60))
    if (hours > 24) return `${Math.floor(hours / 24)}d ago`
    if (hours > 0) return `${hours}h ago`
    return `${minutes}m ago`
  }
}

export default function CronPage() {
  const [jobs, setJobs] = useState<CronJob[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchJobs()
    const interval = setInterval(fetchJobs, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  async function fetchJobs() {
    try {
      const res = await fetch('/api/cron')
      if (res.ok) {
        const data: CronResponse = await res.json()
        setJobs(data.jobs || [])
      }
    } catch (err) {
      console.error('Failed to fetch cron jobs:', err)
    }
    setLoading(false)
  }

  async function toggleJob(jobId: string, currentState: boolean) {
    setActionLoading(jobId)
    try {
      const action = currentState ? 'disable' : 'enable'
      const res = await fetch('/api/cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, action }),
      })
      if (res.ok) {
        await fetchJobs()
      }
    } catch (err) {
      console.error('Toggle failed:', err)
    }
    setActionLoading(null)
  }

  const activeJobs = jobs.filter(j => j.enabled)
  const disabledJobs = jobs.filter(j => !j.enabled)

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-white">Cron Jobs</h1>
          <p className="text-white/60 text-lg mt-2">
            Scheduled tasks and automation
            {!loading && (
              <span className="ml-3 text-sm">
                <span className="text-emerald-400">{activeJobs.length} active</span>
                {disabledJobs.length > 0 && (
                  <span className="text-white/40 ml-2">· {disabledJobs.length} disabled</span>
                )}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => fetchJobs()}
          className="px-4 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.05] text-white/60 text-sm font-medium transition-colors"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-white/40 text-sm py-12 text-center">Loading cron jobs...</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-white/30 text-sm">No cron jobs configured</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active Jobs */}
          {activeJobs.length > 0 && (
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-white mb-4">
                Active Jobs
              </h2>
              <div className="space-y-3">
                {activeJobs.map(job => (
                  <div
                    key={job.id}
                    className="bg-white/[0.03] backdrop-blur-sm rounded-2xl p-6 border border-white/[0.08] hover:border-emerald-500/30 transition-all duration-300 shadow-lg shadow-black/20"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-display text-base font-semibold text-white">{job.name}</h3>
                          {AGENT_MAP[job.agentId] && (
                            <span className="text-xs text-white/40">
                              {AGENT_MAP[job.agentId].emoji} {AGENT_MAP[job.agentId].name}
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            job.state?.lastStatus === 'ok' 
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : job.state?.lastStatus === 'error'
                              ? 'bg-red-500/15 text-red-400'
                              : 'bg-white/[0.06] text-white/50'
                          }`}>
                            {job.state?.lastStatus || 'pending'}
                          </span>
                        </div>
                        <p className="text-white/40 text-sm font-mono">{formatSchedule(job.schedule)}</p>
                      </div>
                      <button
                        onClick={() => toggleJob(job.id, job.enabled)}
                        disabled={actionLoading === job.id}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        Enabled
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-white/40 text-xs mb-1">Next Run</p>
                        <p className="text-white/80 text-sm font-medium">
                          {job.state?.nextRunAtMs 
                            ? formatTime(job.state.nextRunAtMs)
                            : 'Not scheduled'}
                        </p>
                      </div>
                      <div>
                        <p className="text-white/40 text-xs mb-1">Last Run</p>
                        <p className="text-white/80 text-sm font-medium">
                          {job.state?.lastRunAtMs 
                            ? formatTime(job.state.lastRunAtMs)
                            : 'Never'}
                        </p>
                      </div>
                      <div>
                        <p className="text-white/40 text-xs mb-1">Duration</p>
                        <p className="text-white/80 text-sm font-medium">
                          {job.state?.lastDurationMs 
                            ? `${(job.state.lastDurationMs / 1000).toFixed(1)}s`
                            : '—'}
                        </p>
                      </div>
                    </div>

                    {job.payload.message && (
                      <details className="mt-3">
                        <summary className="text-white/40 text-xs cursor-pointer hover:text-white/60 transition-colors">
                          View task details
                        </summary>
                        <div className="mt-2 p-3 rounded-lg bg-black/20">
                          <p className="text-white/50 text-xs leading-relaxed whitespace-pre-wrap">
                            {job.payload.message.slice(0, 300)}
                            {job.payload.message.length > 300 && '...'}
                          </p>
                        </div>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disabled Jobs */}
          {disabledJobs.length > 0 && (
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-white mb-4">
                Disabled Jobs
              </h2>
              <div className="space-y-3">
                {disabledJobs.map(job => (
                  <div
                    key={job.id}
                    className="bg-white/[0.03] backdrop-blur-sm rounded-2xl p-6 border border-white/[0.08] opacity-60 shadow-lg shadow-black/20"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-display text-base font-semibold text-white">{job.name}</h3>
                          {AGENT_MAP[job.agentId] && (
                            <span className="text-xs text-white/40">
                              {AGENT_MAP[job.agentId].emoji} {AGENT_MAP[job.agentId].name}
                            </span>
                          )}
                        </div>
                        <p className="text-white/40 text-sm font-mono">{formatSchedule(job.schedule)}</p>
                      </div>
                      <button
                        onClick={() => toggleJob(job.id, job.enabled)}
                        disabled={actionLoading === job.id}
                        className="px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.05] text-white/60 text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        Disabled
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </AppShell>
  )
}
