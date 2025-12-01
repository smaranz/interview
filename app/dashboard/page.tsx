import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPracticeSessions, getPracticeSessionStats } from '@/lib/practice-sessions'
import { PracticeStats } from '@/components/PracticeStats'
import { PracticeSessionList } from '@/components/PracticeSessionList'

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic'

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
