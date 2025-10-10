import { supabase } from './supabase'

export const TOKEN_KEY = 'admin_token'

export async function login(email: string, password: string): Promise<{ token: string }> {
  // sign in with email/password
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error || !data.session || !data.user) {
    throw new Error(error?.message || 'Login failed')
  }

  // confirm admin role using your existing "profile" table
  const userId = data.user.id
  const { data: profile, error: pErr } = await supabase
    .from('profile')                 // use your actual table name
    .select('role,is_admin')
    .eq('id', userId)
    .single()

  if (pErr || !profile) {
    throw new Error(pErr?.message || 'Profile not found')
  }

  if (!(profile.role === 'admin' || profile.is_admin === true)) {
    // sign out session on client if not allowed
    await supabase.auth.signOut().catch(() => {})
    throw new Error('Unauthorized: admin access required')
  }

  const token = data.session.access_token
  localStorage.setItem(TOKEN_KEY, token)
  return { token }
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut().catch(() => {})
  localStorage.removeItem(TOKEN_KEY)
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}
