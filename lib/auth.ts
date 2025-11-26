'use server'

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
  try {
    if (!userId || !email) {
      console.error('createProfileIfNotExists: userId and email are required')
      return null
    }

    const supabase = await createClient()
    
    // Check if profile already exists
    const { data: existingProfile, error: selectError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()
    
    // If profile exists, return it
    if (existingProfile) {
      return existingProfile
    }
    
    // If error is not "not found", log it but continue to try creating
    if (selectError && selectError.code !== 'PGRST116') {
      console.error('Error checking for existing profile:', selectError)
    }
    
    // Create new profile
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email,
        full_name: fullName ?? null,
        avatar_url: avatarUrl ?? null,
        credits: 0, // Initialize with 0 credits
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('Error creating profile:', insertError.code, insertError.message, insertError.details)
      return null
    }
    
    return newProfile
  } catch (error) {
    console.error('Exception in createProfileIfNotExists:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return null
  }
}

