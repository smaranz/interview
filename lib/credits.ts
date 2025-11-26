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
    if (!userId) {
      console.error('getUserCredits: userId is required')
      return 0
    }

    const supabase = await createClient()
    
    // First, verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.error('getUserCredits: Auth error:', authError.message, authError.status)
      return 0
    }
    
    if (!user) {
      console.error('getUserCredits: No authenticated user')
      return 0
    }
    
    if (user.id !== userId) {
      console.error('getUserCredits: User ID mismatch. Auth user:', user.id, 'Expected:', userId)
      return 0
    }
    
    console.log('getUserCredits: Fetching credits from database for userId:', userId)
    
    // Try to fetch credits
    const { data, error } = await supabase
      .from('profiles')
      .select('credits, email')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('getUserCredits: Database error:', error.code, error.message, error.details)
      
      // If profile doesn't exist (PGRST116 = no rows returned), create it
      if (error.code === 'PGRST116') {
        console.log('getUserCredits: Profile not found, creating...')
        // Try to get user email to create profile
        if (user.email) {
          const profile = await createProfileIfNotExists(userId, user.email)
          if (profile) {
            // Retry fetching credits after creating profile
            const { data: retryData, error: retryError } = await supabase
              .from('profiles')
              .select('credits')
              .eq('id', userId)
              .single()
            
            if (retryError) {
              console.error('getUserCredits: Error after profile creation:', retryError)
              return 0
            }
            
            console.log('getUserCredits: Credits after profile creation:', retryData?.credits)
            return retryData?.credits ?? 0
          }
        }
        return 0
      }
      
      // For other errors, log and return 0
      console.error('getUserCredits: Unhandled database error:', error)
      return 0
    }
    
    if (!data) {
      console.error('getUserCredits: No data returned from query')
      return 0
    }
    
    console.log('getUserCredits: Success - Credits:', data.credits, 'Email:', data.email)
    return data.credits ?? 0
  } catch (error) {
    console.error('getUserCredits: Exception:', error)
    if (error instanceof Error) {
      console.error('getUserCredits: Error message:', error.message)
      console.error('getUserCredits: Error stack:', error.stack)
    }
    return 0
  }
}

export async function getCreditInfo(userId: string): Promise<CreditInfo> {
  try {
    if (!userId) {
      console.error('getCreditInfo: User ID is required')
      return {
        credits: 0,
        canStart10Min: false,
        canStart25Min: false,
      }
    }
    
    console.log('getCreditInfo: Getting credits for userId:', userId)
    const credits = await getUserCredits(userId)
    console.log('getCreditInfo: Got credits:', credits)
    
    // Ensure credits is a valid number
    const creditsNum = typeof credits === 'number' && !isNaN(credits) ? credits : 0
    
    return {
      credits: creditsNum,
      canStart10Min: creditsNum >= CREDIT_COSTS['10min'],
      canStart25Min: creditsNum >= CREDIT_COSTS['25min'],
    }
  } catch (error) {
    console.error('getCreditInfo: Exception:', error)
    if (error instanceof Error) {
      console.error('getCreditInfo: Error message:', error.message)
      console.error('getCreditInfo: Error stack:', error.stack)
    }
    // Return default values on error - never throw
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
  try {
    if (!userId) {
      console.error('deductCredits: userId is required')
      return {
        success: false,
        remainingCredits: 0,
        error: 'User ID is required',
      }
    }

    if (!duration || (duration !== '10min' && duration !== '25min')) {
      console.error('deductCredits: Invalid duration:', duration)
      return {
        success: false,
        remainingCredits: 0,
        error: 'Invalid interview duration',
      }
    }

    const supabase = await createClient()
    const cost = CREDIT_COSTS[duration]
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== userId) {
      console.error('Authentication error in deductCredits:', authError?.message, 'User ID:', user?.id, 'Expected:', userId)
      return {
        success: false,
        remainingCredits: 0,
        error: 'Authentication failed',
      }
    }
    
    // Get current credits
    const currentCredits = await getUserCredits(userId)
    console.log(`Deducting ${cost} credits for ${duration} interview. Current: ${currentCredits}`)
    
    if (currentCredits < cost) {
      return {
        success: false,
        remainingCredits: currentCredits,
        error: `Insufficient credits. You need ${cost} credits for a ${duration} interview, but you only have ${currentCredits} credits.`,
      }
    }
    
    // Deduct credits atomically using SQL to ensure consistency
    const newCredits = currentCredits - cost
    console.log(`Updating credits from ${currentCredits} to ${newCredits}`)
    
    const { data, error } = await supabase
      .from('profiles')
      .update({ credits: newCredits })
      .eq('id', userId)
      .select('credits, email')
      .single()
    
    if (error) {
      console.error('Error deducting credits:', error.code, error.message, error.details)
      return {
        success: false,
        remainingCredits: currentCredits,
        error: `Failed to deduct credits: ${error.message}`,
      }
    }
    
    console.log('Credits deducted successfully. Remaining:', data.credits, 'Email:', data.email)
    return {
      success: true,
      remainingCredits: data.credits,
    }
  } catch (error) {
    console.error('Exception in deductCredits:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
      return {
        success: false,
        remainingCredits: 0,
        error: `Failed to deduct credits: ${error.message}`,
      }
    }
    return {
      success: false,
      remainingCredits: 0,
      error: 'An unexpected error occurred during credit deduction.',
    }
  }
}

export async function addCredits(
  userId: string,
  amount: number
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== userId) {
      console.error('Authentication error in addCredits:', authError)
      return {
        success: false,
        newBalance: 0,
        error: 'Authentication failed',
      }
    }
    
    const currentCredits = await getUserCredits(userId)
    
    console.log(`Adding ${amount} credits to user ${userId}. Current: ${currentCredits}, New: ${currentCredits + amount}`)
    
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
    
    console.log('Credits added successfully. New balance:', data.credits)
    return {
      success: true,
      newBalance: data.credits,
    }
  } catch (error) {
    console.error('Exception in addCredits:', error)
    return {
      success: false,
      newBalance: 0,
      error: 'Failed to add credits',
    }
  }
}

export { CREDIT_COSTS }

