'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase, Task, Blocker, LinkedInPost, LinkedInAuth, AgentStatus } from './supabase'

export function useAgentStatus() {
  const [statuses, setStatuses] = useState<AgentStatus[]>([])
  const [loading, setLoading] = useState(true)

  const fetchStatuses = useCallback(async () => {
    const { data } = await supabase
      .from('agent_status')
      .select('*')
      .order('agent_id')
    if (data) setStatuses(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchStatuses()
    const interval = setInterval(fetchStatuses, 15000)
    return () => clearInterval(interval)
  }, [fetchStatuses])

  return { statuses, loading }
}

/** Derive display status from heartbeat timing */
export function deriveStatus(agent: AgentStatus): 'active' | 'idle' | 'offline' {
  if (!agent.last_heartbeat) return 'offline'
  const intervalMs = parseInterval(agent.heartbeat_interval || '5m')
  const elapsed = Date.now() - new Date(agent.last_heartbeat).getTime()
  if (elapsed < intervalMs * 2.5) return 'active'
  if (elapsed < intervalMs * 5) return 'idle'
  return 'offline'
}

function parseInterval(s: string): number {
  const m = s.match(/^(\d+)(s|m|h)$/)
  if (!m) return 300000
  const n = parseInt(m[1])
  if (m[2] === 's') return n * 1000
  if (m[2] === 'm') return n * 60000
  return n * 3600000
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .order('updated_at', { ascending: false })
    if (data) {
      const statusOrder: Record<string, number> = { in_progress: 0, waiting: 1, backlog: 2, blocked: 0, done: 3 }
      const prioOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
      data.sort((a: any, b: any) => {
        const sd = (statusOrder[a.status] ?? 2) - (statusOrder[b.status] ?? 2)
        if (sd !== 0) return sd
        return (prioOrder[a.priority] ?? 2) - (prioOrder[b.priority] ?? 2)
      })
      setTasks(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetch()
    const interval = setInterval(fetch, 30000)
    return () => clearInterval(interval)
  }, [fetch])

  return { tasks, loading, refresh: fetch }
}

export function useBlockers() {
  const [blockers, setBlockers] = useState<Blocker[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from('blockers')
      .select('*, task:tasks(*)')
      .eq('resolved', false)
      .order('created_at', { ascending: false })
    if (data) setBlockers(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetch()
    const interval = setInterval(fetch, 30000)
    return () => clearInterval(interval)
  }, [fetch])

  return { blockers, loading, refresh: fetch }
}

export interface UsageData {
  agents: Record<string, { tokens: number; cost: number; model: string; sessions: number }>
  total: { tokens: number; cost: number }
  history: any[]
  fetchedAt: string
}

export function useUsage() {
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUsage = useCallback(async () => {
    try {
      const res = await fetch('/api/usage?history=true')
      if (res.ok) {
        const data = await res.json()
        setUsage(data)
      }
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchUsage()
    const interval = setInterval(fetchUsage, 60000)
    return () => clearInterval(interval)
  }, [fetchUsage])

  return { usage, loading }
}

export interface Improvement {
  id: string
  proposal_id: string | null
  title: string
  description: string | null
  impact: string
  risk: string
  owner: string | null
  status: string
  outcome: string | null
  approved_by: string | null
  approved_at: string | null
  implemented_at: string | null
  created_at: string
  updated_at: string
}

export function useImprovements() {
  const [improvements, setImprovements] = useState<Improvement[]>([])
  const [loading, setLoading] = useState(true)

  const fetchImprovements = useCallback(async () => {
    try {
      const res = await fetch('/api/improvements')
      if (res.ok) {
        const data = await res.json()
        setImprovements(data)
      }
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchImprovements()
    const interval = setInterval(fetchImprovements, 30000)
    return () => clearInterval(interval)
  }, [fetchImprovements])

  return { improvements, loading, refresh: fetchImprovements }
}

export function useLinkedInPosts() {
  const [posts, setPosts] = useState<LinkedInPost[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPosts = useCallback(async () => {
    const { data } = await supabase
      .from('linkedin_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) setPosts(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPosts()
    const interval = setInterval(fetchPosts, 15000)
    return () => clearInterval(interval)
  }, [fetchPosts])

  return { posts, loading, refresh: fetchPosts }
}

export function useLinkedInAuth() {
  const [auth, setAuth] = useState<LinkedInAuth | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('linkedin_auth')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      setAuth(data)
      setLoading(false)
    }
    fetch()
  }, [])

  return { auth, loading }
}
