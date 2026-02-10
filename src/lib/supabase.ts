import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Task {
  id: string
  project: string
  task: string
  owner: string
  status: string
  priority: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Blocker {
  id: string
  task_id: string | null
  description: string
  blocking_who: string
  needs_input_from: string | null
  resolved: boolean
  created_at: string
  task?: Task
}
