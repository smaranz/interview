import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPracticeSessions, getPracticeSessionStats } from '@/lib/practice-sessions'
import { PracticeStats } from '@/components/PracticeStats'
import { PracticeSessionList } from '@/components/PracticeSessionList'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Fetch practice sessions and stats
  const [sessions, stats] = await Promise.all([
    getPracticeSessions(user.id),
    getPracticeSessionStats(user.id),
  ])

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            View your practice session stats and history
          </p>
        </div>

        <div className="space-y-8">
          {/* Stats Section */}
          <section>
            <h2 className="mb-4 text-lg font-semibold">Your Stats</h2>
            <PracticeStats {...stats} />
          </section>

          {/* Practice Sessions List */}
          <section>
            <h2 className="mb-4 text-lg font-semibold">Practice Sessions</h2>
            <PracticeSessionList sessions={sessions} />
          </section>
        </div>
      </div>
    </div>
  )
}
