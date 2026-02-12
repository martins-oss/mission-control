import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const GATEWAY_URL = process.env.GATEWAY_URL || 'https://gateway.dothework.fit'
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN!

export async function GET() {
  try {
    const response = await fetch(`${GATEWAY_URL}/api/cron/list`, {
      headers: {
        'Authorization': `Bearer ${GATEWAY_TOKEN}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json({ 
        error: 'Failed to fetch cron jobs',
        details: error 
      }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Cron list failed:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch cron jobs',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { jobId, action } = body

    if (!jobId || !action) {
      return NextResponse.json({ error: 'Missing jobId or action' }, { status: 400 })
    }

    const response = await fetch(`${GATEWAY_URL}/api/cron/${action}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GATEWAY_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jobId }),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json({ 
        error: `Failed to ${action} job`,
        details: error 
      }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Cron action failed:', error)
    return NextResponse.json({ 
      error: 'Failed to execute cron action',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
