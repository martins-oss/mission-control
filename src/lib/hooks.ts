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
      .order('priority', { ascending: false })
      .order('updated_at', { ascending: false })
    if (data) setTasks(data)
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
