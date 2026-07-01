'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { getGoogleClientId } from './actions'

function base64UrlEncode(buffer: Uint8Array): string {
  let binary = ''
  const len = buffer.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i])
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const hash = await globalThis.crypto.subtle.digest('SHA-256', data)
  return base64UrlEncode(new Uint8Array(hash))
}

function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  globalThis.crypto.getRandomValues(array)
  return base64UrlEncode(array)
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      // 1. Generate PKCE code_verifier and code_challenge
      const codeVerifier = generateCodeVerifier()
      const codeChallenge = await generateCodeChallenge(codeVerifier)

      // 2. Save verifier and state in sessionStorage to verify the callback
      const state = generateCodeVerifier() // Using verifier generator as a safe random string
      sessionStorage.setItem('pkce_code_verifier', codeVerifier)
      sessionStorage.setItem('oauth_state', state)

      // 3. Prepare OAuth URL
      // Fetch the Client ID from the server at runtime because Docker standalone 
      // builds cannot bake in NEXT_PUBLIC_ env vars securely or dynamically.
      const clientId = await getGoogleClientId()
      if (!clientId) {
        throw new Error("Server could not provide a Google Client ID. Check your .env file.")
      }

      const redirectUri = `${window.location.origin}/api/auth/callback`

      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
      authUrl.searchParams.append('client_id', clientId)
      authUrl.searchParams.append('redirect_uri', redirectUri)
      authUrl.searchParams.append('response_type', 'code')
      authUrl.searchParams.append('scope', 'openid email profile')
      authUrl.searchParams.append('code_challenge', codeChallenge)
      authUrl.searchParams.append('code_challenge_method', 'S256')
      authUrl.searchParams.append('state', state)
      authUrl.searchParams.append('access_type', 'offline')
      authUrl.searchParams.append('prompt', 'consent')

      // 4. Redirect user to Google
      window.location.href = authUrl.toString()
    } catch (error) {
      console.error(error)
      alert('Failed to initiate login')
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-radial from-slate-900 via-slate-950 to-black overflow-hidden font-sans">
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-md p-8 mx-4 border border-slate-800/80 bg-slate-900/40 backdrop-blur-xl rounded-2xl shadow-2xl flex flex-col justify-center items-center text-center">
        <div className="mb-6 flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-400 to-purple-600 text-white font-bold text-xl shadow-lg shadow-cyan-500/20">
          Ω
        </div>

        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-tight mb-2">
          Antigravity Platform
        </h1>
        <p className="text-sm text-slate-400 mb-8 max-w-[280px]">
          Enterprise Multi-Tenant AI Business Operations Engine
        </p>

        <Button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full h-11 bg-white hover:bg-slate-100 text-black font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 border border-slate-200 cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            <span className="w-5 h-5 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.147 4.114-3.41 0-6.173-2.762-6.173-6.17 0-3.41 2.763-6.173 6.173-6.173 1.48 0 2.85.526 3.924 1.455l3.078-3.078C18.89 1.912 15.772 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.262 0 11.385-5.06 11.385-11.24 0-.766-.078-1.5-.224-2.195H12.24z" />
              </svg>
              <span>Sign in with Google</span>
            </>
          )}
        </Button>

        <div className="mt-8 text-[11px] text-slate-500 max-w-[280px]">
          By continuing, you agree to our Terms of Service and Privacy Policy. Securely managed with Refresh Token Rotation (RTR).
        </div>
      </div>
    </div>
  )
}
