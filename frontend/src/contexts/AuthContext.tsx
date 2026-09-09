import type { Session, User } from '@supabase/supabase-js'
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface AuthState {
  session: Session | null
  user: User | null
  isAdmin: boolean
  displayName: string | null
  loading: boolean
}

const initialState: AuthState = {
  session: null,
  user: null,
  isAdmin: false,
  displayName: null,
  loading: true,
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState)

  useEffect(() => {
    let active = true

    async function resolveSession(session: Session | null) {
      if (!session?.user) {
        if (active) setState({ ...initialState, loading: false })
        return
      }

      const { data } = await supabase
        .from('admins')
        .select('display_name')
        .eq('id', session.user.id)
        .maybeSingle()

      if (active) {
        setState({
          session,
          user: session.user,
          isAdmin: !!data,
          displayName: data?.display_name ?? null,
          loading: false,
        })
      }
    }

    supabase.auth.getSession().then(({ data }) => resolveSession(data.session))

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      resolveSession(session)
    })

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
