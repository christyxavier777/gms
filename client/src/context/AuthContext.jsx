/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'

const AuthContext = createContext()

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
  const queryClient = useQueryClient()
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const data = await api.me()
        setUser({ ...data.user, role: normalizeRole(data.user?.role) })
        setToken('cookie-session')
      } catch {
        setUser(null)
        setToken(null)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = async ({ email, password }) => {
    const { user: nextUserRaw } = await api.login({ email, password })
    const nextUser = { ...nextUserRaw, role: normalizeRole(nextUserRaw?.role) }
    queryClient.clear()
    setUser(nextUser)
    setToken('cookie-session')
    return {
      dashboardPath: getDashboardPath(nextUser.role),
      user: nextUser,
      sessionToken: 'cookie-session',
    }
  }

  const register = async ({ name, email, phone, password, role, inviteCode }) => {
    await api.register({ name, email, phone, password, role, inviteCode })
    return login({ email, password })
  }

  const logout = async () => {
    try {
      await api.logout()
    } catch {
      // noop
    }
    queryClient.clear()
    setUser(null)
    setToken(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(user),
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
