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
// ВАЖНО: plain boolean-значения вместо геттеров —
// Zustand shallow-merge уничтожает JS-геттеры при первом вызове set()
const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isBuyer: false,
      isSupplier: false,
      isAdmin: false,

      login: (token, user) => set({
        token,
        user,
        isAuthenticated: true,
        isBuyer: user.type === 'buyer',
        isSupplier: user.type === 'supplier',
        isAdmin: !!user.is_staff,
      }),

      setUser: (user) => set((state) => ({
        ...state,
        user,
        isBuyer: user.type === 'buyer',
        isSupplier: user.type === 'supplier',
        isAdmin: !!user.is_staff,
      })),

      logout: () => set({
        token: null,
        user: null,
        isAuthenticated: false,
        isBuyer: false,
        isSupplier: false,
        isAdmin: false,
      }),
    }),
    { name: 'auth-storage' }
  )
)

export default useAuthStore
