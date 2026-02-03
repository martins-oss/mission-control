'use client'
import { useEffect, useState } from 'react'
import { supabase, TeamMember, Project, Activity, Alert } from './supabase'

export function useTeamMembers() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initial fetch
    supabase
      .from('team_members')
      .select('*')
      .order('name')
      .then(({ data }) => {
        if (data) setMembers(data)
        setLoading(false)
      })

    // Real-time subscription
    const channel = supabase
      .channel('team_members_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'team_members' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setMembers(prev => prev.map(m => 
              m.id === payload.new.id ? payload.new as TeamMember : m
            ))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return { members, loading }
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch projects with owner and task counts
    async function fetchProjects() {
      const { data: projectsData } = await supabase
        .from('projects')
        .select(`
          *,
          owner:team_members(*)
        `)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })

      if (projectsData) {
        // Get task counts for each project
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
    }

    fetchProjects()

    // Real-time subscription
    const channel = supabase
      .channel('projects_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        () => { fetchProjects() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return { projects, loading }
}

export function useActivities(limit = 20) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchActivities() {
      const { data } = await supabase
        .from('activities')
        .select(`
          *,
          team_member:team_members(*),
          project:projects(*)
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (data) setActivities(data)
      setLoading(false)
    }

    fetchActivities()

    // Real-time subscription
    const channel = supabase
      .channel('activities_changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activities' },
        () => { fetchActivities() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [limit])

  return { activities, loading }
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

    // Real-time subscription
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
    todayCost: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      // Task counts by status
      const [activeRes, blockedRes, doneRes, costRes] = await Promise.all([
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'blocked'),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'done'),
        supabase.from('daily_costs').select('cost_usd').eq('date', new Date().toISOString().split('T')[0])
      ])

      const todayCost = costRes.data?.reduce((sum, c) => sum + Number(c.cost_usd), 0) || 0

      setStats({
        active: activeRes.count || 0,
        blocked: blockedRes.count || 0,
        done: doneRes.count || 0,
        todayCost
      })
      setLoading(false)
    }

    fetchStats()

    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  return { stats, loading }
}
