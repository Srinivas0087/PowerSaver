import { createContext, useContext, useEffect, useState } from 'react'
import {
  fetchProfile,
  loginUser,
  logoutUser,
  registerUser,
  socialLogin as socialLoginUser,
} from '../services/authService.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // On first load: if a token is saved, ask the server who it belongs to
  useEffect(() => {
    async function restore() {
      if (!localStorage.getItem('token')) {
        setLoading(false)
        return
      }
      try {
        setUser(await fetchProfile())
      } catch {
        localStorage.removeItem('token') // token is invalid or expired
      }
      setLoading(false)
    }
    restore()
  }, [])

  async function login(username, password) {
    const data = await loginUser(username, password)
    localStorage.setItem('token', data.token)
    setUser(data.user)
  }

  async function register(form) {
    const data = await registerUser(form)
    localStorage.setItem('token', data.token)
    setUser(data.user)
  }

  async function socialLogin(provider, identityToken, state, fullName, intent) {
    const data = await socialLoginUser(provider, identityToken, state, fullName, intent)
    localStorage.setItem('token', data.token)
    setUser(data.user)
  }

  async function logout() {
    try {
      await logoutUser()
    } catch {
      // even if the server is unreachable, still log out on this device
    }
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, socialLogin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}