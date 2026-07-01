'use client'

import { ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoading } = useAuth()

  // During the initial session fetch, we can show a global loading state
  // to prevent flashing unauthenticated content.
  // Note: the Next.js middleware handles hard redirects before rendering,
  // so if we reach this point on a protected route, we generally have a token.
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}
