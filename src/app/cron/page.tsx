'use client'
import { useEffect, useState, useCallback } from 'react'
import AppShell from '@/components/AppShell'
import { HeroStatCard } from '@/components/HeroStatCard'
import { supabase, CronJob } from '@/lib/supabase'
import { AGENT_MAP, AGENT_COLORS } from '@/lib/constants'

function formatScheduleHuman(schedule: any): string {
  if (!schedule) return 'Unknown'
  let raw = schedule
  if (typeof schedule === 'string') {
    try { raw = JSON.parse(schedule) } catch { return schedule }
  }
  if (raw.kind === 'at') return `Once at ${formatTime(raw.at)}`
  if (raw.kind === 'every') {
    const ms = raw.everyMs
    if (ms < 60000) return `Every ${ms / 1000}s`
    if (ms < 3600000) return `Every ${ms / 60000}m`
    if (ms < 86400000) return `Every ${ms / 3600000}h`
    return `Every ${ms / 86400000}d`
  }
  if (raw.kind === 'cron') return parseCronToHuman(raw.expr, raw.tz)
  return JSON.stringify(schedule)
}

function parseCronToHuman(expr: string, tz?: string): string {
  const parts = expr.split(' ')
  if (parts.length < 5) return expr
  const [min, hour, dom, mon, dow] = parts
  const tzLabel = tz || 'UTC'
  if (dom === '*' && mon === '*') {
    if (dow === '*' && hour !== '*' && min !== '*') return `Daily ${formatHourMin(hour, min)} ${tzLabel}`
    if (dow === '1-5') return `Weekdays ${formatHourMin(hour, min)} ${tzLabel}`
  }
  if (hour !== '*' && min !== '*') return `${formatHourMin(hour, min)} ${tzLabel}`
  return `${expr} (${tzLabel})`
}

function formatHourMin(hour: string, min: string): string {
  const h = parseInt(hour), m = parseInt(min)
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })
  } catch { return iso }
}

function formatRelativeTime(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now()
  const abs = Math.abs(diff)
  if (abs < 60000) return diff > 0 ? 'in <1m' : '<1m ago'
  if (abs < 3600000) { const m = Math.round(abs / 60000); return diff > 0 ? `in ${m}m` : `${m}m ago` }
  if (abs < 86400000) { const h = Math.round(abs / 3600000); return diff > 0 ? `in ${h}h` : `${h}h ago` }
  const d = Math.round(abs / 86400000); return diff > 0 ? `in ${d}d` : `${d}d ago`
}

function getJobHealthColor(job: CronJob): string {
  if (!job.enabled) return '#555555'
  if (!job.last_run) return '#FFB800' // pending
  // If next_run is overdue by more than 2x the expected interval, it's unhealthy
  if (job.next_run) {
    const overdue = Date.now() - new Date(job.next_run).getTime()
    if (overdue > 3600000) return '#FF2D7B' // red: overdue >1h
    if (overdue > 0) return '#FFB800' // amber: slightly overdue
  }
  return '#39FF14' // green: healthy
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
    if (!error) setJobs(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchJobs()
    const interval = setInterval(fetchJobs, 30000)
    return () => clearInterval(interval)
  }, [fetchJobs])

  const enabled = jobs.filter(j => j.enabled)
  const disabled = jobs.filter(j => !j.enabled)
  const healthy = enabled.filter(j => getJobHealthColor(j) === '#39FF14').length

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-arcade text-sm text-neon-green text-glow-green mb-2">
            🔧 POWER-UPS
          </h1>
          <p className="text-white/30 text-xs font-mono">
            SCHEDULED TASKS — ALL TIMES UTC
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <HeroStatCard label="Active" value={enabled.length} icon="⚡" color="green" />
          <HeroStatCard label="Healthy" value={healthy} icon="💚" color={healthy === enabled.length ? 'green' : 'amber'} />
          <HeroStatCard label="Paused" value={disabled.length} icon="⏸" color="gray" />
        </div>

        {/* Active Jobs as Power-Up Cards */}
        {enabled.length > 0 && (
          <div>
            <h2 className="font-arcade text-[9px] text-white/30 mb-3 tracking-widest">ACTIVE POWER-UPS</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {enabled.map(job => {
                const color = getJobHealthColor(job)
                const agent = job.agent_id ? AGENT_MAP[job.agent_id] : null
                const agentColor = job.agent_id ? AGENT_COLORS[job.agent_id]?.neon : null

                return (
                  <div
                    key={job.id}
                    className="arcade-card p-4 transition-all duration-300"
                    style={{
                      borderColor: color + '25',
                      boxShadow: `0 0 20px ${color}10`,
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <h3 className="font-mono text-xs text-white/70 truncate">
                            {job.name || job.job_id}
                          </h3>
                        </div>
                        {agent && (
                          <span className="text-[10px] font-mono ml-4" style={{ color: (agentColor || '#888') + '80' }}>
                            {agent.emoji} {agent.name}
                          </span>
                        )}
                      </div>
                      <span
                        className="px-2 py-0.5 rounded text-[9px] font-mono"
                        style={{
                          backgroundColor: color + '15',
                          color: color,
                        }}
                      >
                        {color === '#39FF14' ? 'HEALTHY' : color === '#FFB800' ? 'PENDING' : 'OVERDUE'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                      <div>
                        <span className="text-white/20 block">SCHEDULE</span>
                        <span className="text-white/50">{formatScheduleHuman(job.schedule)}</span>
                      </div>
                      <div>
                        <span className="text-white/20 block">NEXT</span>
                        <span style={{ color: color + 'CC' }}>
                          {job.next_run ? formatRelativeTime(job.next_run) : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-white/20 block">LAST</span>
                        <span className="text-white/40">
                          {job.last_run ? formatRelativeTime(job.last_run) : 'never'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Disabled Jobs */}
        {disabled.length > 0 && (
          <div>
            <h2 className="font-arcade text-[9px] text-white/20 mb-3 tracking-widest">PAUSED</h2>
            <div className="arcade-card divide-y divide-arcade-border">
              {disabled.map(job => (
                <div key={job.id} className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-white/30 text-xs font-mono">{job.name || job.job_id}</p>
                    <p className="text-white/15 text-[10px] font-mono">{formatScheduleHuman(job.schedule)}</p>
                  </div>
                  <span className="text-[9px] font-mono text-white/15 px-2 py-0.5 bg-white/[0.03] rounded">
                    PAUSED
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty / Loading */}
        {loading && (
          <div className="arcade-card p-12 text-center">
            <p className="font-arcade text-[10px] text-white/20 loading-text">SCANNING POWER-UPS</p>
          </div>
        )}
        {!loading && jobs.length === 0 && (
          <div className="arcade-card p-12 text-center">
            <p className="font-arcade text-[10px] text-white/20">NO POWER-UPS CONFIGURED</p>
            <p className="text-white/10 text-xs font-mono mt-2">INSERT COIN TO CONTINUE</p>
          </div>
        )}
      </div>
    </AppShell>
  )
}
