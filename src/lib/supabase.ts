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

export interface LinkedInPost {
  id: string
  title: string | null
  content: string
  media_url: string | null
  status: 'draft' | 'approved' | 'scheduled' | 'posted' | 'failed'
  scheduled_at: string | null
  posted_at: string | null
  linkedin_post_id: string | null
  author: string
  approved_by: string | null
  approved_at: string | null
  error: string | null
  created_at: string
  updated_at: string
}

export interface LinkedInAuth {
  id: string
  user_urn: string
  access_token: string
  refresh_token: string | null
  expires_at: string
  created_at: string
}
