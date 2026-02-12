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
  status: 'draft' | 'feedback_requested' | 'approved' | 'scheduled' | 'posted' | 'failed'
  scheduled_at: string | null
  posted_at: string | null
  linkedin_post_id: string | null
  author: string
  approved_by: string | null
  approved_at: string | null
  error: string | null
  feedback: string | null
  feedback_at: string | null
  media_urls: string[] | null
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

export interface AgentStatus {
  agent_id: string
  status: string
  current_task: string | null
  last_heartbeat: string | null
  last_message: string | null
  model: string | null
  heartbeat_interval: string | null
  tools: any | null
  updated_at: string
}

export interface Improvement {
  id: string
  proposal_id: string | null
  title: string
  description: string | null
  impact: 'low' | 'medium' | 'high'
  risk: 'low' | 'medium' | 'high'
  owner: string | null
  status: 'proposed' | 'needs_approval' | 'approved' | 'rejected' | 'implemented'
  outcome: string | null
  approved_by: string | null
  approved_at: string | null
  implemented_at: string | null
  created_at: string
  updated_at: string
}

export interface AgentUsage {
  id: string
  agent_id: string
  date: string
  model: string
  input_tokens: number
  output_tokens: number
  cache_read_tokens: number
  cache_write_tokens: number
  input_cost: number
  output_cost: number
  cache_read_cost: number
  cache_write_cost: number
  total_cost: number
  message_count: number
  created_at: string
}

export interface CronJob {
  id: string
  job_id: string
  name: string | null
  schedule: any
  payload_kind: string
  session_target: string
  enabled: boolean
  last_run: string | null
  next_run: string | null
  agent_id: string | null
  updated_at: string
}

export interface AgentWorkspace {
  id: string
  agent_id: string
  file_path: string
  size_bytes: number
  updated_at: string
}
