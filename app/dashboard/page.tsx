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
  averageScore: number | null
  totalPracticeTime: number
  sessionsByDuration: { '10min': number; '25min': number }
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [sessions, setSessions] = useState<PracticeSession[]>([])
  const [stats, setStats] = useState<Stats>({
    totalSessions: 0,
    averageScore: null,
    totalPracticeTime: 0,
    sessionsByDuration: { '10min': 0, '25min': 0 },
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
        
        const averageScore = completedSessions.length > 0
          ? Math.round(completedSessions.reduce((acc, s) => acc + (s.score || 0), 0) / completedSessions.length)
          : null
        
        const sessionsByDuration = sessionsData?.reduce((acc, s) => {
          if (s.duration === '10min') {
            acc['10min'] = (acc['10min'] || 0) + 1
          } else if (s.duration === '25min') {
            acc['25min'] = (acc['25min'] || 0) + 1
          }
          return acc
        }, { '10min': 0, '25min': 0 } as { '10min': number; '25min': number }) || { '10min': 0, '25min': 0 }
        
        setStats({
          totalSessions: sessionsData?.length || 0,
          averageScore,
          totalPracticeTime: totalMinutes,
          sessionsByDuration,
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
