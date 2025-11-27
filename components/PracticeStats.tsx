'use client'

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
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalSessions}</div>
          <p className="text-xs text-muted-foreground">
            Practice interviews completed
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {averageScore !== null ? `${averageScore}%` : 'N/A'}
          </div>
          <p className="text-xs text-muted-foreground">
            {averageScore !== null
              ? 'Based on all sessions'
              : 'Complete a session to see your score'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Practice Time</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPracticeTime} min</div>
          <p className="text-xs text-muted-foreground">
            Total time practicing
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Session Breakdown</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {sessionsByDuration['10min'] + sessionsByDuration['25min']}
          </div>
          <p className="text-xs text-muted-foreground">
            {sessionsByDuration['10min']} × 10min, {sessionsByDuration['25min']} × 25min
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

