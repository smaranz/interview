'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { PracticeStats } from '@/components/PracticeStats'
import { PracticeSessionList } from '@/components/PracticeSessionList'

interface PracticeSession {
  id: string
  job_url: string
  job_title: string | null
  duration: string
  score: number | null
  created_at: string
  feedback: {
    strengths?: string[]
    improvements?: string[]
    overallFeedback?: string
  } | null
}

interface Stats {
  totalSessions: number
  avgScore: number
  completedSessions: number
  totalPracticeMinutes: number
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [sessions, setSessions] = useState<PracticeSession[]>([])
  const [stats, setStats] = useState<Stats>({
    totalSessions: 0,
    avgScore: 0,
    completedSessions: 0,
    totalPracticeMinutes: 0,
  })
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
      return
    }

    if (user) {
      fetchDashboardData()
    }
  }, [user, loading, router])

  const fetchDashboardData = async () => {
    try {
      const supabase = createClient()
      
      // Fetch practice sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('practice_sessions')
        .select('*')
        .eq('user_id', user!.uid)
        .order('created_at', { ascending: false })
      
      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError)
      } else {
        setSessions(sessionsData || [])
        
        // Calculate stats
        const completedSessions = sessionsData?.filter(s => s.score !== null) || []
        const totalMinutes = sessionsData?.reduce((acc, s) => {
          const mins = s.duration === '25min' ? 25 : 10
          return acc + mins
        }, 0) || 0
        
        const avgScore = completedSessions.length > 0
          ? completedSessions.reduce((acc, s) => acc + (s.score || 0), 0) / completedSessions.length
          : 0
        
        setStats({
          totalSessions: sessionsData?.length || 0,
          avgScore: Math.round(avgScore),
          completedSessions: completedSessions.length,
          totalPracticeMinutes: totalMinutes,
        })
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setDataLoading(false)
    }
  }

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-white/60">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Dashboard</h1>
          <p className="mt-3 text-lg text-white/60">
            View your practice session stats and history
          </p>
        </div>

        <div className="space-y-12">
          {/* Stats Section */}
          <section>
            <h2 className="mb-6 text-2xl font-semibold">Your Stats</h2>
            <PracticeStats {...stats} />
          </section>

          {/* Practice Sessions List */}
          <section>
            <h2 className="mb-6 text-2xl font-semibold">Practice Sessions</h2>
            <PracticeSessionList sessions={sessions} />
          </section>
        </div>
      </div>
    </div>
  )
}
