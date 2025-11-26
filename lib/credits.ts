'use server'

import { createClient } from '@/lib/supabase/server'
import { createProfileIfNotExists } from '@/lib/auth'

export interface CreditInfo {
  credits: number
  canStart10Min: boolean
  canStart25Min: boolean
}

const CREDIT_COSTS = {
  '10min': 15,
  '25min': 30,
} as const

export type InterviewDuration = '10min' | '25min'

export async function getUserCredits(userId: string): Promise<number> {
  try {
    const supabase = await createClient()
    
    // First, verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== userId) {
      console.error('Authentication error:', authError, 'User ID:', user?.id, 'Expected:', userId)
      return 0
    }
    
    console.log('Fetching credits from database for userId:', userId)
    const { data, error } = await supabase
      .from('profiles')
      .select('credits, email')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('Error fetching credits:', error)
      // If profile doesn't exist (PGRST116 = no rows returned), create it
      if (error.code === 'PGRST116') {
        // Try to get user email to create profile
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser?.email) {
          await createProfileIfNotExists(userId, authUser.email)
          // Retry fetching credits after creating profile
          const { data: retryData } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', userId)
            .single()
          console.log('Credits after profile creation:', retryData?.credits)
          return retryData?.credits ?? 0
        }
        return 0
      }
      throw error
    }
    
    console.log('Credits from database:', data?.credits, 'Email:', data?.email)
    return data?.credits ?? 0
  } catch (error) {
    console.error('Failed to get user credits:', error)
    return 0
  }
}

export async function getCreditInfo(userId: string): Promise<CreditInfo> {
  try {
    if (!userId) {
      throw new Error('User ID is required')
    }
    
    const credits = await getUserCredits(userId)
    
    return {
      credits,
      canStart10Min: credits >= CREDIT_COSTS['10min'],
      canStart25Min: credits >= CREDIT_COSTS['25min'],
    }
  } catch (error) {
    console.error('Failed to get credit info:', error)
    // Return default values on error
    return {
      credits: 0,
      canStart10Min: false,
      canStart25Min: false,
    }
  }
}

export async function deductCredits(
  userId: string,
  duration: InterviewDuration
): Promise<{ success: boolean; remainingCredits: number; error?: string }> {
  const supabase = await createClient()
  const cost = CREDIT_COSTS[duration]
  
  // Get current credits
  const currentCredits = await getUserCredits(userId)
  
  if (currentCredits < cost) {
    return {
      success: false,
      remainingCredits: currentCredits,
      error: `Insufficient credits. You need ${cost} credits for a ${duration} interview, but you only have ${currentCredits} credits.`,
    }
  }
  
  // Deduct credits atomically
  const { data, error } = await supabase
    .from('profiles')
    .update({ credits: currentCredits - cost })
    .eq('id', userId)
    .select('credits')
    .single()
  
  if (error) {
    console.error('Error deducting credits:', error)
    return {
      success: false,
      remainingCredits: currentCredits,
      error: 'Failed to deduct credits. Please try again.',
    }
  }
  
  return {
    success: true,
    remainingCredits: data.credits,
  }
}

export async function addCredits(
  userId: string,
  amount: number
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  const supabase = await createClient()
  
  const currentCredits = await getUserCredits(userId)
  
  const { data, error } = await supabase
    .from('profiles')
    .update({ credits: currentCredits + amount })
    .eq('id', userId)
    .select('credits')
    .single()
  
  if (error) {
    console.error('Error adding credits:', error)
    return {
      success: false,
      newBalance: currentCredits,
      error: 'Failed to add credits. Please try again.',
    }
  }
  
  return {
    success: true,
    newBalance: data.credits,
  }
}

export { CREDIT_COSTS }

