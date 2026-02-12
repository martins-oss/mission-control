import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN || process.env.OPENCLAW_GATEWAY_TOKEN

export const dynamic = 'force-dynamic'

// POST /api/cron/sync — Upsert cron jobs from OpenClaw
export async function POST(req: NextRequest) {
  // Auth: gateway token
  const auth = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!auth || auth !== GATEWAY_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const jobs = Array.isArray(body) ? body : body.jobs

    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
      return NextResponse.json({ error: 'Expected array of jobs' }, { status: 400 })
    }

    // Upsert each job
    const results = []
    for (const job of jobs) {
      if (!job.job_id) {
        results.push({ error: 'Missing job_id', job })
        continue
      }

      const record = {
        job_id: job.job_id,
        name: job.name || null,
        schedule: typeof job.schedule === 'string' ? JSON.parse(job.schedule) : job.schedule,
        payload_kind: job.payload_kind || 'unknown',
        session_target: job.session_target || 'unknown',
        enabled: job.enabled ?? true,
        last_run: job.last_run || null,
        next_run: job.next_run || null,
        agent_id: job.agent_id || null,
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('cron_jobs')
        .upsert(record, { onConflict: 'job_id' })
        .select()
        .single()

      if (error) {
        results.push({ error: error.message, job_id: job.job_id })
      } else {
        results.push({ success: true, job_id: job.job_id })
      }
    }

    const succeeded = results.filter(r => 'success' in r).length
    const failed = results.filter(r => 'error' in r).length

    return NextResponse.json({
      synced: succeeded,
      failed,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('Cron sync error:', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Unknown error',
    }, { status: 500 })
  }
}
