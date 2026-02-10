import { useMemo, useState } from 'react'
import api from '../api/axios'
import AuthContext from './authContextBase'

const getStoredUser = () => {
  const raw = localStorage.getItem('auth_user')
  return raw ? JSON.parse(raw) : null
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser)
  const [accessToken, setAccessToken] = useState(
    localStorage.getItem('access_token')
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const login = async (username, password) => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/login/', { username, password })
      localStorage.setItem('access_token', data.access)
      localStorage.setItem('refresh_token', data.refresh)
      const nextUser = { username }
      localStorage.setItem('auth_user', JSON.stringify(nextUser))
      setUser(nextUser)
      setAccessToken(data.access)
      return { ok: true }
    } catch (err) {
      const message =
        err?.response?.data?.detail ||
        'Connexion impossible. Verifiez vos identifiants.'
      setError(message)
      return { ok: false, message }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('auth_user')
    setUser(null)
    setAccessToken(null)
  }

  const value = useMemo(
    () => ({
      user,
      accessToken,
      login,
      logout,
      loading,
      error,
      isAuthenticated: Boolean(accessToken),
    }),
    [user, accessToken, loading, error]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
