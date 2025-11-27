'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, Calendar, Clock, Star } from 'lucide-react'
import type { PracticeSession } from '@/lib/practice-sessions'

interface PracticeSessionListProps {
  sessions: PracticeSession[]
}

export function PracticeSessionList({ sessions }: PracticeSessionListProps) {
  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            No practice sessions yet. Start practicing to see your sessions here!
          </p>
          <Link href="/practice" className="mt-4 inline-block">
            <Button>Start Practicing</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <Card key={session.id} className="hover:bg-accent/50 transition-colors">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg mb-2">
                  {session.job_title || 'Practice Interview'}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(session.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {session.duration}
                  </div>
                  {session.score !== null && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      {session.score}%
                    </div>
                  )}
                </div>
              </div>
              <Link href={`/practice/${session.id}`}>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <a
                href={session.job_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View Job Posting
                <ExternalLink className="h-3 w-3" />
              </a>
              <Badge variant={session.score !== null ? 'default' : 'secondary'}>
                {session.score !== null ? 'Feedback Available' : 'No Feedback'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

