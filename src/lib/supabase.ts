import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types based on our schema
export interface TeamMember {
  id: string
  name: string
  emoji: string
  role: string
  status: 'active' | 'idle' | 'offline'
  session_key?: string
  last_activity?: string
  created_at: string
}

export interface Project {
  id: string
  name: string
  description?: string
  owner_id?: string
  owner?: TeamMember
  status: 'backlog' | 'active' | 'blocked' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high' | 'critical'
  tags: string[]
  created_at: string
  updated_at: string
  task_count?: number
  done_count?: number
}

export interface Task {
  id: string
  project_id: string
  assignee_id?: string
  assignee?: TeamMember
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'blocked' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high' | 'critical'
  blocked_by?: string
  due_date?: string
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  team_member_id?: string
  team_member?: TeamMember
  project_id?: string
  project?: Project
  task_id?: string
  action: string
  details: Record<string, unknown>
  severity: 'info' | 'warning' | 'error' | 'success'
  created_at: string
}

export interface Alert {
  id: string
  team_member_id?: string
  team_member?: TeamMember
  project_id?: string
  type: 'blocked' | 'failed' | 'needs_input' | 'cost_warning' | 'milestone'
  message: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  dedup_key?: string
  acknowledged: boolean
  created_at: string
}

export interface DailyCost {
  id: string
  team_member_id: string
  date: string
  input_tokens: number
  output_tokens: number
  cost_usd: number
}
