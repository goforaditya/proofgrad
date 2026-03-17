import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { Session as SupabaseSession } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { setTelemetryUser } from '@/lib/telemetry'
import type { User, UserRole, GuestState } from '@/types'

// -------------------------------------------------------
// Guest helpers (sessionStorage)
// -------------------------------------------------------

const GUEST_KEY = 'proofgrad_guest'

export function getGuestState(): GuestState | null {
  try {
    const raw = sessionStorage.getItem(GUEST_KEY)
    return raw ? (JSON.parse(raw) as GuestState) : null
  } catch {
    return null
  }
}

export function setGuestState(state: GuestState): void {
  sessionStorage.setItem(GUEST_KEY, JSON.stringify(state))
}

export function clearGuestState(): void {
  sessionStorage.removeItem(GUEST_KEY)
}

// -------------------------------------------------------
// Auth context types
// -------------------------------------------------------

interface AuthContextValue {
  user: User | null
  session: SupabaseSession | null
  loading: boolean
  guestState: GuestState | null
  signUp: (
    email: string,
    password: string,
    name: string,
    role: UserRole
  ) => Promise<{ error: string | null }>
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
  setGuestSession: (state: GuestState) => void
  clearGuest: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

// -------------------------------------------------------
// Auth provider
// -------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<SupabaseSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [guestState, setGuestStateLocal] = useState<GuestState | null>(
    getGuestState
  )

  const fetchUser = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    const u = data as User | null
    setUser(u)
    if (u) {
      setTelemetryUser(u.id, u.name, u.email)
    }
  }, [])

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      if (s?.user) {
        fetchUser(s.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s)
        if (s?.user) {
          fetchUser(s.user.id)
        } else {
          setUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchUser])

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      name: string,
      role: UserRole
    ): Promise<{ error: string | null }> => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, role },
        },
      })
      if (error) return { error: error.message }
      return { error: null }
    },
    []
  )

  const signIn = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ error: string | null }> => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) return { error: error.message }
      return { error: null }
    },
    []
  )

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setTelemetryUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    if (session?.user) {
      await fetchUser(session.user.id)
    }
  }, [session, fetchUser])

  const setGuestSession = useCallback((state: GuestState) => {
    setGuestState(state)
    setGuestStateLocal(state)
  }, [])

  const clearGuest = useCallback(() => {
    clearGuestState()
    setGuestStateLocal(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        guestState,
        signUp,
        signIn,
        signOut,
        refreshUser,
        setGuestSession,
        clearGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// -------------------------------------------------------
// Hook
// -------------------------------------------------------

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return ctx
}
