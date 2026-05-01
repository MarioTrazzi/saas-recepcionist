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

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),

  isAuthenticated: () => !!get().token,

  init: async () => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const user = await authApi.me()
        set({ user, token })
      } catch {
        localStorage.removeItem('token')
        set({ user: null, token: null })
      }
    }
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
    set({ token })
  },
}))
