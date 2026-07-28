import { AuthContext } from '@/features/auth/context/AuthContext'
import { supabase } from '@/shared/supabase/client'
import type { Session, User } from '@supabase/supabase-js'
import { useEffect, useMemo, useState, type PropsWithChildren } from 'react'

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function initializeSession() {
      const { data, error } = await supabase.auth.getSession()

      if (!isMounted) return

      if (error) {
        setUser(null)
        setSession(null)
        setLoading(false)
        return
      }

      setUser(data.session?.user ?? null)
      setSession(data.session ?? null)
      setLoading(false)
    }

    void initializeSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return

      setSession(nextSession)
      setUser(nextSession?.user ?? null)
      setLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      isAuthenticated: session !== null,
    }),
    [user, session, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
