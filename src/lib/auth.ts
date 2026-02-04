'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

export function useAuth(requireAuth = true) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null
      
      // Check if email is from supliful.com
      if (currentUser && !currentUser.email?.endsWith('@supliful.com')) {
        supabase.auth.signOut()
        setUser(null)
      } else {
        setUser(currentUser)
      }
      setLoading(false)
      
      if (requireAuth && !currentUser) {
        router.push('/login')
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null
      
      if (currentUser && !currentUser.email?.endsWith('@supliful.com')) {
        supabase.auth.signOut()
        setUser(null)
        router.push('/login')
      } else {
        setUser(currentUser)
        if (requireAuth && !currentUser) {
          router.push('/login')
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [requireAuth, router])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return { user, loading, signOut }
}
