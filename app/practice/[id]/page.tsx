import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPracticeSessions } from '@/lib/practice-sessions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, Calendar, Clock, Star, ArrowLeft, CheckCircle2, TrendingUp, BookOpen, Lightbulb } from 'lucide-react'
import Link from 'next/link'
import type { InterviewFeedback } from '@/lib/interview-feedback'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PracticeSessionPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  const sessions = await getPracticeSessions(user.id)
  const session = sessions.find(s => s.id === id)

  if (!session) {
    redirect('/dashboard')
  }

  const feedback = session.feedback as InterviewFeedback | null

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-6 py-24 sm:px-8 lg:px-8">
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-6 text-white/70 hover:text-white hover:bg-white/10 rounded-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-white sm:text-4xl">
            {session.job_title || 'Practice Interview'}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-white/50">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(session.created_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {session.duration}
            </div>
            {session.score !== null && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                Score: {session.score}%
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Job Posting Link */}
          <Card>
            <CardHeader>
              <CardTitle>Job Posting</CardTitle>
            </CardHeader>
            <CardContent>
              <a
                href={session.job_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-2"
              >
                View Job Posting
                <ExternalLink className="h-4 w-4" />
              </a>
            </CardContent>
          </Card>

          {/* Feedback Section */}
          {feedback && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Interview Feedback</CardTitle>
                  <Badge variant="default" className="text-lg">
                    {feedback.score}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Overall Feedback */}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Overall Feedback
                  </h3>
                  <p className="text-muted-foreground">{feedback.overallFeedback}</p>
                </div>

                {/* Strengths */}
                {feedback.strengths.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Strengths
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      {feedback.strengths.map((strength, idx) => (
                        <li key={idx}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Areas for Improvement */}
                {feedback.improvements.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      Areas for Improvement
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      {feedback.improvements.map((improvement, idx) => (
                        <li key={idx}>{improvement}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Study Recommendations */}
                {feedback.studyRecommendations.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-purple-500" />
                      Study Recommendations
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      {feedback.studyRecommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Specific Examples */}
                {feedback.specificExamples.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-yellow-500" />
                      Specific Examples
                    </h3>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                      {feedback.specificExamples.map((example, idx) => (
                        <li key={idx}>{example}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Conversation History */}
          <Card>
            <CardHeader>
              <CardTitle>Conversation Transcript</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.isArray(session.conversation_history) &&
                  session.conversation_history.map((message: any, idx: number) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-primary/10 ml-8'
                          : 'bg-secondary mr-8'
                      }`}
                    >
                      <div className="font-semibold text-sm mb-1">
                        {message.role === 'user' ? 'You' : 'Alex (Interviewer)'}
                      </div>
                      <div className="text-muted-foreground whitespace-pre-wrap">
                        {message.content}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

