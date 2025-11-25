import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Video, Calendar, Clock, User, ExternalLink, Play, CheckCircle, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatTime } from '@/lib/utils'
import type { Interview } from '@/lib/supabase/types'

interface PageProps {
  params: Promise<{ id: string }>
}

const statusVariants: Record<Interview['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  scheduled: 'secondary',
  in_progress: 'default',
  completed: 'outline',
  cancelled: 'destructive',
}

const statusLabels: Record<Interview['status'], string> = {
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export default async function InterviewPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  const { data: interview } = await supabase
    .from('interviews')
    .select('*')
    .eq('id', id)
    .eq('creator_id', user.id)
    .single()

  if (!interview) {
    notFound()
  }

  const { data: events } = await supabase
    .from('interview_events')
    .select('*')
    .eq('interview_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                {interview.title}
              </h1>
              <Badge variant={statusVariants[interview.status]}>
                {statusLabels[interview.status]}
              </Badge>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
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

          <div className="flex gap-2">
            {interview.mode === 'live' && interview.meet_link && (
              <a href={interview.meet_link} target="_blank" rel="noopener noreferrer">
                <Button>
                  <Video className="mr-2 h-4 w-4" />
                  Join Google Meet
                  <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
              </a>
            )}
            {interview.mode === 'practice' && interview.status === 'scheduled' && (
              <Link href="/practice">
                <Button>
                  <Play className="mr-2 h-4 w-4" />
                  Start Practice
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Interview Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Mode</p>
                  <p className="font-medium capitalize">
                    {interview.mode}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">
                    {statusLabels[interview.status]}
                  </p>
                </div>
                {interview.meet_link && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Meet Link</p>
                    <a
                      href={interview.meet_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:underline"
                    >
                      {interview.meet_link}
                    </a>
                  </div>
                )}
                {interview.notes && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p>{interview.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
            </CardHeader>
            <CardContent>
              {events && events.length > 0 ? (
                <div className="space-y-3">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 rounded-lg bg-secondary p-3"
                    >
                      <div className={`mt-0.5 rounded-full p-1 ${
                        event.type === 'cheat_detected' ? 'bg-destructive/20' :
                        event.type === 'ended' ? 'bg-muted' :
                        'bg-primary/20'
                      }`}>
                        {event.type === 'cheat_detected' ? (
                          <XCircle className="h-4 w-4 text-destructive" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium capitalize">
                          {event.type.replace(/_/g, ' ')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(event.created_at)} at {formatTime(event.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No events recorded yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
