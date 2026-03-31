import { createClient } from './supabase/server'

export type UserRole = 'operator' | 'provider' | 'admin'

export async function getSession() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getUserRole(): Promise<UserRole | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
    
  return data?.role || 'operator'
}

export async function requireAuth(role?: UserRole) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('Authentication required')
  }
  
  if (role) {
    const userRole = await getUserRole()
    if (userRole !== role && userRole !== 'admin') {
      throw new Error(`Insufficient permissions. Required role: ${role}`)
    }
  }
  
  return session
}