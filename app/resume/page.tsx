import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ResumeBuilder from '@/components/ResumeBuilder'

export default async function ResumePage() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      redirect('/auth/signin')
    }
    
    return (
      <div className="min-h-screen bg-black">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Resume Builder & ATS Matcher</h1>
            <p className="mt-2 text-white/70">
              Upload your resume and paste a job posting URL to see how well your resume matches the role.
            </p>
          </div>
          
          <ResumeBuilder />
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading resume page:', error)
    redirect('/auth/signin')
  }
}

