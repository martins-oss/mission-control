'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase, Task, Blocker, LinkedInPost, LinkedInAuth } from './supabase'

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
