import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithMagicLink = async (email: string) => {
    const redirectTo = `${window.location.origin}/auth/callback`
    return supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } })
  }

  const signOut = async () => {
    return supabase.auth.signOut()
  }

  return { user, isLoading, signInWithMagicLink, signOut }
}
