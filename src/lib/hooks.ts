'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase, Task, Blocker } from './supabase'

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
