import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PracticeLayout } from '@/components/PracticeLayout'

export default async function PracticePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Practice Mode</h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Practice with our AI interviewer and improve your skills
          </p>
        </div>

        <PracticeLayout />
      </div>
    </div>
  )
}

