import { create } from 'zustand'

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface AuthSlice {
  user: User | null
  token: string | null
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  logout: () => void
}

interface TenantSlice {
  activeTenantId: string | null
  setActiveTenantId: (tenantId: string | null) => void
}

export const useBoundStore = create<AuthSlice & TenantSlice>((set) => ({
  user: null,
  token: null,
  activeTenantId: null,
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  logout: () => set({ user: null, token: null, activeTenantId: null }),
  setActiveTenantId: (activeTenantId) => set({ activeTenantId }),
}))
