'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function OAuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const codeVerifier = sessionStorage.getItem('pkce_code_verifier')
    const savedState = sessionStorage.getItem('oauth_state')

    if (!code) {
      setError('No authorization code found in URL.')
      return
    }

    if (state !== savedState) {
      setError('Invalid state parameter (CSRF mismatch). Please try logging in again.')
      return
    }

    if (!codeVerifier) {
      setError('No PKCE code verifier found in session storage. Please try logging in again.')
      return
    }

    // Exchange the code for tokens
    const exchangeTokens = async () => {
      try {
        const response = await fetch('/api/auth/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, codeVerifier }),
        })

        if (!response.ok) {
          const data = await response.json()
          setError(data.error || 'Failed to exchange tokens')
          return
        }

        // Successfully authenticated, clean up storage and redirect
        sessionStorage.removeItem('pkce_code_verifier')
        router.push('/dashboard')
      } catch (err) {
        console.error('Exchange error:', err)
        setError('Network error during authentication')
      }
    }

    exchangeTokens()
  }, [searchParams, router])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-xl text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Authentication Failed</h2>
          <p className="text-slate-400 mb-6 text-sm">{error}</p>
          <button 
            onClick={() => router.push('/login')}
            className="w-full h-10 bg-white text-black font-semibold rounded-lg hover:bg-slate-200 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Authenticating</h2>
        <p className="text-slate-400 text-sm">Please wait while we verify your credentials...</p>
      </div>
    </div>
  )
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <OAuthCallback />
    </Suspense>
  )
}
