'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Clock, Target, BarChart3 } from 'lucide-react'

interface PracticeStatsProps {
  totalSessions: number
  averageScore: number | null
  totalPracticeTime: number
  sessionsByDuration: { '10min': number; '25min': number }
}

export function PracticeStats({
  totalSessions,
  averageScore,
  totalPracticeTime,
  sessionsByDuration,
}: PracticeStatsProps) {
  const stats = [
    {
      title: 'Total Sessions',
      value: totalSessions,
      description: 'Practice interviews completed',
      icon: BarChart3,
    },
    {
      title: 'Average Score',
      value: averageScore !== null ? `${averageScore}%` : 'N/A',
      description: averageScore !== null ? 'Based on all sessions' : 'Complete a session to see your score',
      icon: TrendingUp,
    },
    {
      title: 'Practice Time',
      value: `${totalPracticeTime} min`,
      description: 'Total time practicing',
      icon: Clock,
    },
    {
      title: 'Session Breakdown',
      value: sessionsByDuration['10min'] + sessionsByDuration['25min'],
      description: `${sessionsByDuration['10min']} × 10min, ${sessionsByDuration['25min']} × 25min`,
      icon: Target,
    },
  ]

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -4 }}
          >
            <div className="group relative rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:bg-white/10 hover:shadow-xl hover:shadow-white/5">
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white/5 via-white/0 to-white/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 rounded-2xl" />
              
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-medium text-white/60">{stat.title}</h3>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10 transition-colors group-hover:bg-white/10 group-hover:ring-white/20">
                  <Icon className="h-5 w-5 text-white/80 group-hover:text-white" />
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-3xl font-bold text-white tracking-tight">{stat.value}</div>
                <p className="text-sm text-white/40">{stat.description}</p>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
