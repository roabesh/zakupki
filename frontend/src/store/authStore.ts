import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  isBuyer: boolean
  isSupplier: boolean
  isAdmin: boolean
  login: (token: string, user: User) => void
  setUser: (user: User) => void
  logout: () => void
}

// Хранилище аутентификации с персистентностью в localStorage
const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      get isAuthenticated() { return !!get().token },
      get isBuyer() { return get().user?.type === 'buyer' },
      get isSupplier() { return get().user?.type === 'supplier' },
      get isAdmin() { return !!get().user?.is_staff },

      login: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'auth-storage' }
  )
)

export default useAuthStore
