import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

export const dynamic = 'force-dynamic'

interface CronJobPayload {
  job_id: string
  agent_id?: string
  name?: string
  enabled: boolean
  schedule: string // JSON string
  payload_kind: string
  session_target: string
  last_run?: string | null
  next_run?: string | null
}

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.includes(GATEWAY_TOKEN)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const jobs: CronJobPayload[] = await req.json()

    if (!Array.isArray(jobs)) {
      return NextResponse.json({ error: 'Expected an array of cron jobs' }, { status: 400 })
    }

    // Note: agent_id column should exist from migration
    // If it doesn't, the upsert will fail with a clear error message

    let syncedCount = 0
    const errors: string[] = []

    for (const job of jobs) {
      try {
        // Parse schedule string to JSONB
        let scheduleJson
        try {
          scheduleJson = typeof job.schedule === 'string' ? JSON.parse(job.schedule) : job.schedule
        } catch (e) {
          errors.push(`Invalid schedule JSON for job ${job.job_id}`)
          continue
        }

        const { error } = await supabase
          .from('cron_jobs')
          .upsert({
            job_id: job.job_id,
            agent_id: job.agent_id || null,
            name: job.name || null,
            enabled: job.enabled,
            schedule: scheduleJson,
            payload_kind: job.payload_kind,
            session_target: job.session_target,
            last_run: job.last_run || null,
            next_run: job.next_run || null,
            updated_at: new Date().toISOString(),
          }, { 
            onConflict: 'job_id',
            ignoreDuplicates: false 
          })

        if (error) {
          errors.push(`Job ${job.job_id}: ${error.message}`)
        } else {
          syncedCount++
        }
      } catch (e) {
        errors.push(`Job ${job.job_id}: ${e instanceof Error ? e.message : String(e)}`)
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      synced: syncedCount,
      total: jobs.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Cron jobs sync failed:', error)
    return NextResponse.json({
      error: 'Failed to sync cron jobs',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('cron_jobs')
      .select('*')
      .order('next_run', { ascending: true, nullsFirst: false })

    if (error) throw error

    return NextResponse.json({
      jobs: data || [],
      count: data?.length || 0,
      fetchedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Cron jobs fetch failed:', error)
    return NextResponse.json({
      error: 'Failed to fetch cron jobs',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
