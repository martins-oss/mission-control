'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase, TeamMember, Project, Activity, Alert } from './supabase'

export function useTeamMembers() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMembers = useCallback(async () => {
    const { data } = await supabase
      .from('team_members')
      .select('*')
      .order('name')
    if (data) setMembers(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchMembers()

    // Real-time subscription
    const channel = supabase
      .channel('team_members_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'team_members' },
        () => fetchMembers()
      )
      .subscribe()

    // Refresh every 30s
    const interval = setInterval(fetchMembers, 30000)

    return () => { 
      supabase.removeChannel(channel) 
      clearInterval(interval)
    }
  }, [fetchMembers])

  return { members, loading, refresh: fetchMembers }
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProjects = useCallback(async () => {
    const { data: projectsData } = await supabase
      .from('projects')
      .select(`
        *,
        owner:team_members(*)
      `)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })

    if (projectsData) {
      const projectsWithCounts = await Promise.all(
        projectsData.map(async (p) => {
          const { count: taskCount } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', p.id)
          
          const { count: doneCount } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', p.id)
            .eq('status', 'done')

          return {
            ...p,
            task_count: taskCount || 0,
            done_count: doneCount || 0
          }
        })
      )
      setProjects(projectsWithCounts)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchProjects()

    const channel = supabase
      .channel('projects_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        () => fetchProjects()
      )
      .subscribe()

    const interval = setInterval(fetchProjects, 30000)

    return () => { 
      supabase.removeChannel(channel) 
      clearInterval(interval)
    }
  }, [fetchProjects])

  return { projects, loading, refresh: fetchProjects }
}

interface ChatActivity {
  id: string
  agent_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
  team_member?: TeamMember
}

export function useActivities(limit = 20) {
  const [activities, setActivities] = useState<(Activity | ChatActivity)[]>([])
  const [loading, setLoading] = useState(true)

  const fetchActivities = useCallback(async () => {
    // Fetch from activities table
    const { data: activityData } = await supabase
      .from('activities')
      .select(`
        *,
        team_member:team_members(*),
        project:projects(*)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Also fetch recent chat messages as activity
    const { data: chatData } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    // Get team members for chat messages
    const { data: members } = await supabase
      .from('team_members')
      .select('*')

    const memberMap = new Map(members?.map(m => [m.name.toLowerCase(), m]) || [])

    // Transform chat messages into activity format
    const chatActivities: ChatActivity[] = (chatData || []).map(msg => ({
      id: msg.id,
      agent_id: msg.agent_id,
      role: msg.role,
      content: msg.content,
      created_at: msg.created_at,
      team_member: memberMap.get(msg.agent_id)
    }))

    // Combine and sort by date
    const combined = [...(activityData || []), ...chatActivities]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit)

    setActivities(combined)
    setLoading(false)
  }, [limit])

  useEffect(() => {
    fetchActivities()

    // Real-time subscription for activities
    const activityChannel = supabase
      .channel('activities_changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activities' },
        () => fetchActivities()
      )
      .subscribe()

    // Real-time subscription for chat messages
    const chatChannel = supabase
      .channel('chat_messages_changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        () => fetchActivities()
      )
      .subscribe()

    // Refresh every 15 seconds
    const interval = setInterval(fetchActivities, 15000)

    return () => { 
      supabase.removeChannel(activityChannel)
      supabase.removeChannel(chatChannel)
      clearInterval(interval)
    }
  }, [fetchActivities])

  return { activities, loading, refresh: fetchActivities }
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAlerts() {
      const { data } = await supabase
        .from('alerts')
        .select(`
          *,
          team_member:team_members(*)
        `)
        .eq('acknowledged', false)
        .order('created_at', { ascending: false })

      if (data) setAlerts(data)
      setLoading(false)
    }

    fetchAlerts()

    const channel = supabase
      .channel('alerts_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'alerts' },
        () => { fetchAlerts() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const acknowledgeAlert = async (id: string) => {
    await supabase.from('alerts').update({ acknowledged: true }).eq('id', id)
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  return { alerts, loading, acknowledgeAlert }
}

export function useStats() {
  const [stats, setStats] = useState({
    active: 0,
    blocked: 0,
    done: 0,
    todayCost: 0,
    totalMessages: 0
  })
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0]
    
    const [activeRes, blockedRes, doneRes, costRes, messagesRes] = await Promise.all([
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'blocked'),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'done'),
      supabase.from('daily_costs').select('cost_usd').eq('date', today),
      supabase.from('chat_messages').select('*', { count: 'exact', head: true }).gte('created_at', today + 'T00:00:00')
    ])

    const todayCost = costRes.data?.reduce((sum, c) => sum + Number(c.cost_usd), 0) || 0

    setStats({
      active: activeRes.count || 0,
      blocked: blockedRes.count || 0,
      done: doneRes.count || 0,
      todayCost,
      totalMessages: messagesRes.count || 0
    })
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchStats()

    // Refresh every 15 seconds
    const interval = setInterval(fetchStats, 15000)
    return () => clearInterval(interval)
  }, [fetchStats])

  return { stats, loading, refresh: fetchStats }
}

// Hook for chat messages
export function useChatMessages(agentId: string | null) {
  const [messages, setMessages] = useState<ChatActivity[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMessages = useCallback(async () => {
    if (!agentId) {
      setMessages([])
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: true })
      .limit(100)

    if (data) setMessages(data)
    setLoading(false)
  }, [agentId])

  useEffect(() => {
    fetchMessages()

    if (!agentId) return

    const channel = supabase
      .channel(`chat_${agentId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `agent_id=eq.${agentId}` },
        () => fetchMessages()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [agentId, fetchMessages])

  return { messages, loading, refresh: fetchMessages }
}
