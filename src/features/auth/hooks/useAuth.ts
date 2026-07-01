'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  tenantId: string | null
  role: string
}

interface AuthState {
  authenticated: boolean
  user: User | null
}

async function fetchSession(): Promise<AuthState> {
  const res = await fetch('/api/auth/me')
  if (!res.ok) {
    if (res.status === 401) return { authenticated: false, user: null }
    throw new Error('Failed to fetch session')
  }
  return res.json()
}

export function useAuth() {
  const queryClient = useQueryClient()
  const router = useRouter()

  const { data, isLoading, error } = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: fetchSession,
    retry: false,
    refetchOnWindowFocus: true,
  })

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/auth/logout', { method: 'POST' })
      if (!res.ok) throw new Error('Logout failed')
    },
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'session'], { authenticated: false, user: null })
      router.push('/login')
    },
  })

  return {
    user: data?.user ?? null,
    isAuthenticated: data?.authenticated ?? false,
    isLoading,
    error,
    logout: () => logoutMutation.mutate(),
    isLoggingOut: logoutMutation.isPending,
  }
}
