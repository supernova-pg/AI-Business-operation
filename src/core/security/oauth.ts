export function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  globalThis.crypto.getRandomValues(array)
  return base64UrlEncode(array)
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const hash = await globalThis.crypto.subtle.digest('SHA-256', data)
  return base64UrlEncode(new Uint8Array(hash))
}

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

export async function getGoogleTokens(code: string, codeVerifier: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.replace(/["']/g, '')
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.replace(/["']/g, '')
  const redirectUri = process.env.GOOGLE_REDIRECT_URI?.replace(/["']/g, '')

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Google OAuth configuration is missing')
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code_verifier: codeVerifier,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Failed to exchange Google OAuth code: ${errorBody}`)
  }

  return response.json() // returns { access_token, refresh_token, id_token, expires_in, scope }
}

export async function getGoogleUserInfo(accessToken: string) {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch Google user info')
  }

  return response.json() // returns { id, email, verified_email, name, picture }
}
