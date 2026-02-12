import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function addAgentIdColumn() {
  console.log('Adding agent_id column to cron_jobs table...')
  
  // Use raw SQL via a stored procedure or direct query
  const { data, error } = await supabase.rpc('exec', {
    query: 'ALTER TABLE cron_jobs ADD COLUMN IF NOT EXISTS agent_id TEXT; CREATE INDEX IF NOT EXISTS idx_cron_jobs_agent ON cron_jobs(agent_id);'
  })

  if (error) {
    console.error('Error:', error)
    // Try alternative: direct query
    console.log('Trying alternative method...')
    const result = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'ALTER TABLE cron_jobs ADD COLUMN IF NOT EXISTS agent_id TEXT;'
      })
    })
    console.log('Result:', await result.text())
  } else {
    console.log('Success:', data)
  }
}

addAgentIdColumn().catch(console.error)
