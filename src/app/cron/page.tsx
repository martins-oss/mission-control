'use client'
import { useEffect, useState, useCallback } from 'react'
import AppShell from '@/components/AppShell'
import { supabase, CronJob } from '@/lib/supabase'

function formatSchedule(schedule: any): string {
  if (!schedule) return 'Unknown'
  
  if (schedule.kind === 'at') {
    return `Once at ${new Date(schedule.at).toLocaleString()}`
  } else if (schedule.kind === 'every') {
    const ms = schedule.everyMs
    if (ms < 60000) return `Every ${ms / 1000}s`
    if (ms < 3600000) return `Every ${ms / 60000}m`
    if (ms < 86400000) return `Every ${ms / 3600000}h`
    return `Every ${ms / 86400000}d`
  } else if (schedule.kind === 'cron') {
    return `Cron: ${schedule.expr}${schedule.tz ? ` (${schedule.tz})` : ''}`
  }
  
  return JSON.stringify(schedule)
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
    const interval = setInterval(fetchJobs, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [fetchJobs])

  const enabledJobs = jobs.filter(j => j.enabled)
  const disabledJobs = jobs.filter(j => !j.enabled)

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Scheduled Tasks</h1>
        <p className="text-white/40 text-sm mt-0.5">
          OpenClaw cron jobs for automation and reminders
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-5 border border-white/[0.06]">
          <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Active Jobs</p>
          <p className="text-emerald-400 text-3xl font-bold">{enabledJobs.length}</p>
        </div>
        
        <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-5 border border-white/[0.06]">
          <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Disabled</p>
          <p className="text-white/50 text-3xl font-bold">{disabledJobs.length}</p>
        </div>
        
        <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-5 border border-white/[0.06]">
          <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Next Run</p>
          <p className="text-blue-400 text-sm font-medium">
            {enabledJobs.length > 0 && enabledJobs[0].next_run
              ? new Date(enabledJobs[0].next_run).toLocaleString()
              : 'None scheduled'}
          </p>
        </div>
      </div>

      {/* Active Jobs */}
      {enabledJobs.length > 0 && (
        <div className="mb-8">
          <h2 className="text-white/50 text-[10px] uppercase tracking-wider font-medium mb-3">
            Active Jobs <span className="ml-2 px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">{enabledJobs.length}</span>
          </h2>
          <div className="space-y-3">
            {enabledJobs.map(job => (
              <div
                key={job.id}
                className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-5 border border-white/[0.06]"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-white font-medium text-sm mb-1">
                      {job.name || job.job_id}
                    </h3>
                    <p className="text-white/40 text-xs font-mono">{job.job_id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-400">
                      Enabled
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-white/40 mb-1">Schedule</p>
                    <p className="text-white/70">{formatSchedule(job.schedule)}</p>
                  </div>
                  <div>
                    <p className="text-white/40 mb-1">Target</p>
                    <p className="text-white/70">{job.session_target}</p>
                  </div>
                  <div>
                    <p className="text-white/40 mb-1">Payload</p>
                    <p className="text-white/70">{job.payload_kind}</p>
                  </div>
                  <div>
                    <p className="text-white/40 mb-1">Next Run</p>
                    <p className="text-blue-400 font-medium">
                      {job.next_run ? new Date(job.next_run).toLocaleString() : 'Not scheduled'}
                    </p>
                  </div>
                </div>

                {job.last_run && (
                  <div className="mt-3 pt-3 border-t border-white/[0.06]">
                    <p className="text-white/40 text-xs">
                      Last run: {new Date(job.last_run).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disabled Jobs */}
      {disabledJobs.length > 0 && (
        <div>
          <h2 className="text-white/50 text-[10px] uppercase tracking-wider font-medium mb-3">Disabled Jobs</h2>
          <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] divide-y divide-white/[0.04]">
            {disabledJobs.map(job => (
              <div key={job.id} className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-white/50 text-sm">{job.name || job.job_id}</p>
                  <p className="text-white/30 text-xs mt-0.5">{formatSchedule(job.schedule)}</p>
                </div>
                <span className="px-2 py-1 rounded-lg text-xs bg-white/[0.04] text-white/40">
                  Disabled
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && jobs.length === 0 && (
        <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-12 text-center">
          <p className="text-white/40 text-sm">No cron jobs configured yet</p>
          <p className="text-white/25 text-xs mt-1">Jobs will appear here once they're created</p>
        </div>
      )}

      {loading && (
        <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-12 text-center">
          <p className="text-white/50 text-sm">Loading cron jobs...</p>
        </div>
      )}
    </AppShell>
  )
}
