import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth/signin')
  }
  
  return user
}

export async function getProfile() {
  const supabase = await createClient()
  const user = await getCurrentUser()
  
  if (!user) {
    return null
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  return profile
}

export async function createProfileIfNotExists(userId: string, email: string, fullName?: string, avatarUrl?: string) {
  const supabase = await createClient()
  
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single()
  
  if (existingProfile) {
    return existingProfile
  }
  
  const { data: newProfile, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email,
      full_name: fullName ?? null,
      avatar_url: avatarUrl ?? null,
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating profile:', error)
    return null
  }
  
  return newProfile
}

