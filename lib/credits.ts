'use server'

import { createClient } from '@/lib/supabase/server'

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
    
    const { data, error } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('Error fetching credits:', error)
      // If profile doesn't exist, return 0 (default)
      if (error.code === 'PGRST116') {
        return 0
      }
      throw error
    }
    
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

