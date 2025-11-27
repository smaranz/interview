'use server'

import { createClient } from '@/lib/supabase/server'
import type { InterviewFeedback } from './interview-feedback'

export interface PracticeSession {
  id: string
  user_id: string
  job_url: string
  job_title: string | null
  duration: '10min' | '25min'
  conversation_history: Array<{ role: 'user' | 'assistant'; content: string; timestamp?: string }>
  feedback: InterviewFeedback | null
  score: number | null
  created_at: string
  updated_at: string
}

export async function savePracticeSession(
  userId: string,
  jobUrl: string,
  duration: '10min' | '25min',
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  feedback: InterviewFeedback | null
): Promise<{ success: boolean; sessionId?: string; error?: string }> {
  try {
    if (!userId) {
      return { success: false, error: 'User ID is required' }
    }

    const supabase = await createClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== userId) {
      return { success: false, error: 'Authentication failed' }
    }

    // Extract job title from URL if possible
    let jobTitle: string | null = null
    try {
      const url = new URL(jobUrl)
      // Try to extract meaningful title from URL
      const pathParts = url.pathname.split('/').filter(Boolean)
      if (pathParts.length > 0) {
        jobTitle = pathParts[pathParts.length - 1].replace(/-/g, ' ').replace(/%20/g, ' ')
      }
    } catch {
      // If URL parsing fails, just use the URL as title
      jobTitle = jobUrl.substring(0, 100)
    }

    const { data, error } = await supabase
      .from('practice_sessions')
      .insert({
        user_id: userId,
        job_url: jobUrl,
        job_title: jobTitle,
        duration,
        conversation_history: conversationHistory as any,
        feedback: feedback as any,
        score: feedback?.score || null,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error saving practice session:', error)
      return { success: false, error: error.message }
    }

    return { success: true, sessionId: data.id }
  } catch (error) {
    console.error('Exception saving practice session:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function getPracticeSessions(userId: string): Promise<PracticeSession[]> {
  try {
    if (!userId) {
      return []
    }

    const supabase = await createClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== userId) {
      return []
    }

    const { data, error } = await supabase
      .from('practice_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching practice sessions:', error)
      return []
    }

    return (data || []) as PracticeSession[]
  } catch (error) {
    console.error('Exception fetching practice sessions:', error)
    return []
  }
}

export async function getPracticeSessionStats(userId: string): Promise<{
  totalSessions: number
  averageScore: number | null
  totalPracticeTime: number // in minutes
  sessionsByDuration: { '10min': number; '25min': number }
}> {
  try {
    if (!userId) {
      return {
        totalSessions: 0,
        averageScore: null,
        totalPracticeTime: 0,
        sessionsByDuration: { '10min': 0, '25min': 0 },
      }
    }

    const supabase = await createClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== userId) {
      return {
        totalSessions: 0,
        averageScore: null,
        totalPracticeTime: 0,
        sessionsByDuration: { '10min': 0, '25min': 0 },
      }
    }

    const { data, error } = await supabase
      .from('practice_sessions')
      .select('duration, score')
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching practice session stats:', error)
      return {
        totalSessions: 0,
        averageScore: null,
        totalPracticeTime: 0,
        sessionsByDuration: { '10min': 0, '25min': 0 },
      }
    }

    const sessions = data || []
    const totalSessions = sessions.length
    
    // Calculate average score
    const scores = sessions.filter(s => s.score !== null).map(s => s.score as number)
    const averageScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null

    // Calculate total practice time
    const sessionsByDuration = {
      '10min': sessions.filter(s => s.duration === '10min').length,
      '25min': sessions.filter(s => s.duration === '25min').length,
    }
    const totalPracticeTime = sessionsByDuration['10min'] * 10 + sessionsByDuration['25min'] * 25

    return {
      totalSessions,
      averageScore,
      totalPracticeTime,
      sessionsByDuration,
    }
  } catch (error) {
    console.error('Exception fetching practice session stats:', error)
    return {
      totalSessions: 0,
      averageScore: null,
      totalPracticeTime: 0,
      sessionsByDuration: { '10min': 0, '25min': 0 },
    }
  }
}

