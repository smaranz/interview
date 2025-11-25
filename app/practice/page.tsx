import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PracticeLayout } from '@/components/PracticeLayout'

export default async function PracticePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  const geminiKey = process.env.GOOGLE_GEMINI_API_KEY || ''

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Practice Mode</h1>
          <p className="mt-1 text-muted-foreground">
            Practice with our AI interviewer and improve your skills
          </p>
        </div>

        <PracticeLayout geminiApiKey={geminiKey} />
      </div>
    </div>
  )
}
