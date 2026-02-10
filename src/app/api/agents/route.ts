import { NextResponse } from 'next/server'
import { AGENTS } from '@/lib/constants'

export const dynamic = 'force-dynamic'

// For v1: agent metadata is static. Status comes from tasks table.
// v2 will add live gateway API integration.
export async function GET() {
  return NextResponse.json({ agents: AGENTS })
}
