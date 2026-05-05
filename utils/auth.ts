import { cookies } from 'next/headers'

export async function getFingerprint() {
  const cookieStore = await cookies()
  return cookieStore.get('x-fingerprint')?.value || 'N/A'
}
