import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { logout as apiLogout, getStoredUser } from '../api/auth'
import type { StoredUser } from '../api/token'

interface AuthContextValue {
  user: StoredUser | null
  isLoggedIn: boolean
  setUser: (user: StoredUser | null) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<StoredUser | null>(getStoredUser)

  const setUser = useCallback((u: StoredUser | null) => {
    setUserState(u)
  }, [])

  const signOut = useCallback(() => {
    apiLogout()
    setUserState(null)
    window.location.replace('/login')
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: user !== null, setUser, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
