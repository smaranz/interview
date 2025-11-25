'use client'

import Link from 'next/link'
import { Calendar, Clock, User, Video, PlayCircle, ExternalLink, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate, formatTime } from '@/lib/utils'
import type { Interview } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface InterviewListProps {
  interviews: Interview[]
}

const statusVariants: Record<Interview['status'], 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  scheduled: 'info',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'danger',
}

const statusLabels: Record<Interview['status'], string> = {
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export function InterviewList({ interviews }: InterviewListProps) {
  const router = useRouter()
  const supabase = createClient()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this interview?')) return
    
    setDeletingId(id)
    await supabase.from('interviews').delete().eq('id', id)
    router.refresh()
    setDeletingId(null)
  }

  if (interviews.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="mb-4 rounded-full bg-zinc-100 p-4 dark:bg-zinc-800">
            <Calendar className="h-8 w-8 text-zinc-400" />
          </div>
          <h3 className="mb-1 text-lg font-medium text-zinc-900 dark:text-zinc-100">
            No interviews yet
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Create your first interview to get started
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {interviews.map((interview) => (
        <Card key={interview.id} className="transition-shadow hover:shadow-md">
          <CardContent className="p-0">
            <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {interview.title}
                  </h3>
                  <Badge variant={statusVariants[interview.status]}>
                    {statusLabels[interview.status]}
                  </Badge>
                  <Badge variant={interview.mode === 'live' ? 'info' : 'default'}>
                    {interview.mode === 'live' ? 'Live' : 'Practice'}
                  </Badge>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <User className="h-4 w-4" />
                    {interview.candidate_email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {formatDate(interview.scheduled_at)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {formatTime(interview.scheduled_at)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {interview.mode === 'live' && interview.meet_link && (
                  <a
                    href={interview.meet_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
                  >
                    <Video className="h-4 w-4" />
                    Join Meet
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                
                <Link href={`/interviews/${interview.id}`}>
                  <Button variant="secondary" size="sm">
                    <PlayCircle className="mr-1.5 h-4 w-4" />
                    Open
                  </Button>
                </Link>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(interview.id)}
                  disabled={deletingId === interview.id}
                  className="text-zinc-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

