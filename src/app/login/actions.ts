'use server'

export async function getGoogleClientId() {
  // Read the environment variable at runtime on the server
  const raw = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
  // Strip quotes just in case docker-compose or .env parsed them literally
  return raw.replace(/["']/g, '')
}
