import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { api } from '../api/client'

export interface AuthUser {
  id: number
  email: string
  role: 'counselor'
  patient_code: string | null
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      setLoading(false)
      return
    }
    api
      .get('/me')
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem('auth_token'))
      .finally(() => setLoading(false))
  }, [])

  async function login(email: string, password: string) {
    const res = await api.post('/login', { email, password })
    localStorage.setItem('auth_token', res.data.token)
    setUser(res.data.user)
    return res.data.user as AuthUser
  }

  async function logout() {
    await api.post('/logout').catch(() => {})
    localStorage.removeItem('auth_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
