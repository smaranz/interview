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
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Practice Mode</h1>
          <p className="mt-1 text-muted-foreground">
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
