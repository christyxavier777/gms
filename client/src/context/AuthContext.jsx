import { createContext, useState, useContext, useEffect } from 'react'
import { api } from '../services/api'

const AuthContext = createContext()
const AUTH_TOKEN_KEY = 'authToken'

function normalizeRole(role) {
  return String(role || '').toUpperCase()
}

function getDashboardPath(role) {
  const normalized = normalizeRole(role)
  if (normalized === 'ADMIN') return '/admin'
  if (normalized === 'TRAINER') return '/trainer'
  return '/member'
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY)
      if (!storedToken) {
        setLoading(false)
        return
      }

      try {
        setToken(storedToken)
        const data = await api.me(storedToken)
        setUser({ ...data.user, role: normalizeRole(data.user?.role) })
      } catch (_error) {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        setUser(null)
        setToken(null)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = async ({ email, password }) => {
    const { token: nextToken } = await api.login({ email, password })
    const data = await api.me(nextToken)
    const nextUser = { ...data.user, role: normalizeRole(data.user?.role) }
    setUser(nextUser)
    setToken(nextToken)
    localStorage.setItem(AUTH_TOKEN_KEY, nextToken)
    return getDashboardPath(nextUser.role)
  }

  const register = async ({ name, email, password }) => {
    await api.register({ name, email, password })
    return login({ email, password })
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem(AUTH_TOKEN_KEY)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(user && token),
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
