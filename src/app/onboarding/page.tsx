'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/hooks/useAuth'

export default function OnboardingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [companyName, setCompanyName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyName.trim()) {
      setError('Company name is required')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to onboard workspace')
        return
      }

      // Successfully onboarded, redirect to dashboard
      // Note: We might want to force React Query to invalidate here, 
      // but reloading the window or just pushing works since the new JWT has the tenantId.
      window.location.href = '/dashboard'
    } catch (err) {
      console.error(err)
      setError('Network error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-radial from-slate-900 via-slate-950 to-black overflow-hidden font-sans">
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-md p-8 mx-4 border border-slate-800/80 bg-slate-900/40 backdrop-blur-xl rounded-2xl shadow-2xl flex flex-col justify-center items-center text-center">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-tight mb-2">
          Welcome, {user?.email?.split('@')[0] || 'User'}
        </h1>
        <p className="text-sm text-slate-400 mb-8">
          Let's set up your business workspace.
        </p>

        <form onSubmit={handleOnboarding} className="w-full flex flex-col gap-4">
          <div className="text-left">
            <label htmlFor="companyName" className="block text-sm font-medium text-slate-300 mb-1">
              Company / Workspace Name
            </label>
            <input
              id="companyName"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Corp"
              className="w-full h-11 px-4 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
              disabled={isLoading}
            />
          </div>

          {error && <p className="text-sm text-red-400 text-left">{error}</p>}

          <Button
            type="submit"
            disabled={isLoading || !companyName.trim()}
            className="w-full h-11 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 disabled:opacity-50 mt-4"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Create Workspace'
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
