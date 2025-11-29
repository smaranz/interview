import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PracticeLayout } from '@/components/PracticeLayout'

export default async function PracticePage() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      redirect('/auth/signin')
    }

    return (
      <div className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-8">
          <div className="mb-12">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Practice Mode</h1>
            <p className="mt-3 text-lg text-white/60">
              Practice with our AI interviewer and improve your skills
            </p>
          </div>

          <PracticeLayout userId={user.id} />
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error in PracticePage:', error)
    redirect('/auth/signin')
  }
}
