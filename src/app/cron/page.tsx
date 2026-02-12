'use client'
import { useEffect, useState, useCallback } from 'react'
import AppShell from '@/components/AppShell'
import { supabase, CronJob } from '@/lib/supabase'
import { AGENT_MAP } from '@/lib/constants'

function formatScheduleHuman(schedule: any): string {
  if (!schedule) return 'Unknown'
  
  let raw = schedule
  if (typeof schedule === 'string') {
    try { raw = JSON.parse(schedule) } catch { return schedule }
  }

  if (raw.kind === 'at') {
    return `Once at ${formatTime(raw.at)}`
  } else if (raw.kind === 'every') {
    const ms = raw.everyMs
    if (ms < 60000) return `Every ${ms / 1000} seconds`
    if (ms < 3600000) return `Every ${ms / 60000} minutes`
    if (ms < 86400000) return `Every ${ms / 3600000} hours`
    return `Every ${ms / 86400000} days`
  } else if (raw.kind === 'cron') {
    return parseCronToHuman(raw.expr, raw.tz)
  }
  
  return JSON.stringify(schedule)
}

function parseCronToHuman(expr: string, tz?: string): string {
  const parts = expr.split(' ')
  if (parts.length < 5) return expr
  
  const [min, hour, dom, mon, dow] = parts
  const tzLabel = tz || 'UTC'
  
  // Common patterns
  if (dom === '*' && mon === '*') {
    if (dow === '*') {
      // Daily
      if (hour !== '*' && min !== '*') {
        return `Daily at ${formatHourMin(hour, min)} ${tzLabel}`
      }
    } else if (dow === '1-5') {
      return `Weekdays at ${formatHourMin(hour, min)} ${tzLabel}`
    } else if (dow === '1,3,5') {
      return `Mon/Wed/Fri at ${formatHourMin(hour, min)} ${tzLabel}`
    }
  }
  
  if (hour !== '*' && min !== '*') {
    return `At ${formatHourMin(hour, min)} ${tzLabel}`
  }
  
  return `${expr} (${tzLabel})`
}

function formatHourMin(hour: string, min: string): string {
  const h = parseInt(hour)
  const m = parseInt(min)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString('en-US', { 
      month: 'short', day: 'numeric', 
      hour: 'numeric', minute: '2-digit',
      timeZoneName: 'short'
    })
  } catch { return iso }
}

function formatRelativeTime(iso: string): string {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diff = then - now
  const absDiff = Math.abs(diff)
  
  if (absDiff < 60000) return diff > 0 ? 'in < 1 min' : '< 1 min ago'
  if (absDiff < 3600000) {
    const mins = Math.round(absDiff / 60000)
    return diff > 0 ? `in ${mins} min` : `${mins} min ago`
  }
  if (absDiff < 86400000) {
    const hrs = Math.round(absDiff / 3600000)
    return diff > 0 ? `in ${hrs}h` : `${hrs}h ago`
  }
  const days = Math.round(absDiff / 86400000)
  return diff > 0 ? `in ${days}d` : `${days}d ago`
}

function getJobDescription(name: string): string {
  const descriptions: Record<string, string> = {
    'daily-briefing': 'Morning summary of tasks, blockers, and priorities',
    'workspace-hygiene': 'Cleans up temp files and optimizes agent workspaces',
    'agent-usage-tracking': 'Syncs token usage and cost data to Mission Control',
    'cron-sync': 'Keeps this cron jobs list in sync',
    'dash-linkedin-content-gen': 'Generates LinkedIn post drafts for review',
    'amber-daily-self-improvement': 'Amber researches tools and improvements',
    'openclaw-update-check': 'Checks for OpenClaw updates',
  }
  
  const key = Object.keys(descriptions).find(k => 
    name.toLowerCase().includes(k.replace(/-/g, '').toLowerCase()) ||
    name.toLowerCase().replace(/[^a-z]/g, '').includes(k.replace(/-/g, ''))
  )
  
  return key ? descriptions[key] : ''
}

export default function CronPage() {
  const [jobs, setJobs] = useState<CronJob[]>([])
  const [loading, setLoading] = useState(true)

  const fetchJobs = useCallback(async () => {
    const { data, error } = await supabase
      .from('cron_jobs')
      .select('*')
      .order('enabled', { ascending: false })
      .order('next_run', { ascending: true })
    
    if (error) {
      console.error('Failed to fetch cron jobs:', error)
    } else {
      setJobs(data || [])
    }
    
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchJobs()
    const interval = setInterval(fetchJobs, 30000)
    return () => clearInterval(interval)
  }, [fetchJobs])

  const enabledJobs = jobs.filter(j => j.enabled)
  const disabledJobs = jobs.filter(j => !j.enabled)

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Scheduled Tasks</h1>
        <p className="text-white/40 text-sm mt-0.5">
          Automated jobs running across all agents. All times shown in UTC.
        </p>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-5 border border-white/[0.06]">
          <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Active</p>
          <p className="text-emerald-400 text-3xl font-bold">{enabledJobs.length}</p>
          <p className="text-white/30 text-xs mt-1">Running on schedule</p>
        </div>
        
        <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-5 border border-white/[0.06]">
          <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Paused</p>
          <p className="text-white/50 text-3xl font-bold">{disabledJobs.length}</p>
          <p className="text-white/30 text-xs mt-1">Disabled or one-time completed</p>
        </div>
        
        <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-5 border border-white/[0.06]">
          <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Next Up</p>
          {enabledJobs.length > 0 && enabledJobs[0].next_run ? (
            <>
              <p className="text-blue-400 text-lg font-bold">
                {formatRelativeTime(enabledJobs[0].next_run)}
              </p>
              <p className="text-white/30 text-xs mt-1">
                {enabledJobs[0].name || enabledJobs[0].job_id}
              </p>
            </>
          ) : (
            <p className="text-white/30 text-sm">Nothing scheduled</p>
          )}
        </div>
      </div>

      {/* Active Jobs */}
      {enabledJobs.length > 0 && (
        <div className="mb-8">
          <h2 className="text-white/50 text-[10px] uppercase tracking-wider font-medium mb-3">
            Active
            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
              {enabledJobs.length}
            </span>
          </h2>
          <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] divide-y divide-white/[0.04]">
            {enabledJobs.map(job => {
              const schedule = typeof job.schedule === 'string' ? (() => { try { return JSON.parse(job.schedule) } catch { return job.schedule } })() : job.schedule
              const desc = getJobDescription(job.name || job.job_id)
              
              return (
                <div key={job.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-medium text-sm">
                          {job.name || job.job_id}
                        </h3>
                        {job.agent_id && AGENT_MAP[job.agent_id] && (
                          <span className="text-white/30 text-xs">
                            via {AGENT_MAP[job.agent_id].name}
                          </span>
                        )}
                      </div>
                      {desc && (
                        <p className="text-white/40 text-xs mt-0.5">{desc}</p>
                      )}
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-500/10 text-emerald-400/80">
                      Active
                    </span>
                  </div>

                  <div className="flex items-center gap-6 text-xs mt-3">
                    <div>
                      <span className="text-white/30">Runs </span>
                      <span className="text-white/60">{formatScheduleHuman(schedule)}</span>
                    </div>
                    {job.next_run && (
                      <div>
                        <span className="text-white/30">Next </span>
                        <span className="text-blue-400/80">{formatRelativeTime(job.next_run)}</span>
                      </div>
                    )}
                    {job.last_run && (
                      <div>
                        <span className="text-white/30">Last </span>
                        <span className="text-white/50">{formatRelativeTime(job.last_run)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Disabled/Paused Jobs */}
      {disabledJobs.length > 0 && (
        <div>
          <h2 className="text-white/50 text-[10px] uppercase tracking-wider font-medium mb-3">Paused</h2>
          <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] divide-y divide-white/[0.04]">
            {disabledJobs.map(job => (
              <div key={job.id} className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-white/40 text-sm">{job.name || job.job_id}</p>
                  <p className="text-white/25 text-xs mt-0.5">{formatScheduleHuman(job.schedule)}</p>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] bg-white/[0.04] text-white/30">
                  Paused
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && jobs.length === 0 && (
        <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-12 text-center">
          <p className="text-white/40 text-sm">No scheduled tasks yet</p>
          <p className="text-white/25 text-xs mt-1">Tasks will appear here once configured in OpenClaw</p>
        </div>
      )}

      {loading && (
        <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-12 text-center">
          <p className="text-white/50 text-sm">Loading...</p>
        </div>
      )}

      {/* Timezone Note */}
      <div className="mt-6 text-center">
        <p className="text-white/20 text-xs">
          All times in UTC. Server timezone: UTC+0.
        </p>
      </div>
    </AppShell>
  )
}
