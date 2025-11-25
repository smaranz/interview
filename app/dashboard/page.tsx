import { redirect } from 'next/navigation'
import { Plus, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { InterviewForm } from '@/components/InterviewForm'
import { InterviewList } from '@/components/InterviewList'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  const { data: interviews } = await supabase
    .from('interviews')
    .select('*')
    .eq('creator_id', user.id)
    .order('scheduled_at', { ascending: true })

  const upcomingInterviews = interviews?.filter(
    (i) => i.status === 'scheduled' && new Date(i.scheduled_at) >= new Date()
  ) || []
  
  const pastInterviews = interviews?.filter(
    (i) => i.status !== 'scheduled' || new Date(i.scheduled_at) < new Date()
  ) || []

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your interviews and practice sessions
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <div className="mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <h2 className="text-lg font-semibold">
                  Upcoming Interviews
                </h2>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                  {upcomingInterviews.length}
                </span>
              </div>
              <InterviewList interviews={upcomingInterviews} />
            </section>

            {pastInterviews.length > 0 && (
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <h2 className="text-lg font-semibold">
                    Past Interviews
                  </h2>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                    {pastInterviews.length}
                  </span>
                </div>
                <InterviewList interviews={pastInterviews} />
              </section>
            )}
          </div>

          <div>
            <div className="mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5" />
              <h2 className="text-lg font-semibold">
                New Interview
              </h2>
            </div>
            <InterviewForm userId={user.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
