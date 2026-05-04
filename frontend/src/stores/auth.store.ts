import { create } from 'zustand'
import { authApi } from '@/lib/api'

interface User {
  id: string
  name: string
  email: string
  role: string
  tenantId: string
}

interface AuthStore {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (data: any) => Promise<void>
  logout: () => void
  isAuthenticated: () => boolean
  init: () => void
  setToken: (token: string) => void
}

function decodeJwt(token: string): any {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return null
  }
}

function userFromPayload(payload: any): User | null {
  if (!payload?.sub) return null
  return {
    id: payload.sub,
    tenantId: payload.tenantId,
    email: payload.email,
    name: payload.name || payload.email?.split('@')[0] || '',
    role: payload.role,
  }
}

function isTokenValid(token: string): boolean {
  const payload = decodeJwt(token)
  if (!payload) return false
  // exp is in seconds
  return payload.exp ? payload.exp * 1000 > Date.now() : true
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,

  isAuthenticated: () => !!get().token,

  init: () => {
    const token = localStorage.getItem('token')
    if (!token) return

    if (!isTokenValid(token)) {
      localStorage.removeItem('token')
      set({ user: null, token: null })
      return
    }

    const payload = decodeJwt(token)
    const user = userFromPayload(payload)
    set({ token, user })
  },

  login: async (email, password) => {
    const { token, user } = await authApi.login(email, password)
    localStorage.setItem('token', token)
    set({ token, user })
  },

  register: async (data) => {
    const { token, user } = await authApi.register(data)
    localStorage.setItem('token', token)
    set({ token, user })
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },

  setToken: (token: string) => {
    localStorage.setItem('token', token)
    const payload = decodeJwt(token)
    const user = userFromPayload(payload)
    set({ token, user })
  },
}))
