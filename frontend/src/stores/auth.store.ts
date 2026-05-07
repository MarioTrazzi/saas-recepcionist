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
  return payload.exp ? payload.exp * 1000 > Date.now() : true
}

// Hydrate synchronously at module load time so the first render already knows
// whether the user is logged in — no flash, no useEffect required.
function loadFromStorage(): { token: string | null; user: User | null } {
  try {
    const stored = localStorage.getItem('token')
    if (!stored) return { token: null, user: null }
    if (!isTokenValid(stored)) {
      localStorage.removeItem('token')
      return { token: null, user: null }
    }
    const payload = decodeJwt(stored)
    return { token: stored, user: userFromPayload(payload) }
  } catch {
    return { token: null, user: null }
  }
}

const _initial = loadFromStorage()

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: _initial.user,
  token: _initial.token,

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
    const res = await authApi.login(email, password)
    const token: string = res.token
    const user: User = res.user ?? userFromPayload(decodeJwt(token))
    localStorage.setItem('token', token)
    set({ token, user })
  },

  register: async (data) => {
    const res = await authApi.register(data)
    const token: string = res.token
    const user: User = res.user ?? userFromPayload(decodeJwt(token))
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
