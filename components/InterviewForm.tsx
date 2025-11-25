'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { generateMockMeetUrl } from '@/lib/google'
import type { InterviewMode } from '@/lib/supabase/types'

interface InterviewFormProps {
  userId: string
  onSuccess?: () => void
}

export function InterviewForm({ userId, onSuccess }: InterviewFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    candidate_email: '',
    scheduled_at: '',
    mode: 'practice' as InterviewMode,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const meetLink = formData.mode === 'live' ? generateMockMeetUrl() : null
      
      const { error: insertError } = await supabase
        .from('interviews')
        .insert({
          creator_id: userId,
          title: formData.title,
          candidate_email: formData.candidate_email,
          scheduled_at: new Date(formData.scheduled_at).toISOString(),
          mode: formData.mode,
          meet_link: meetLink,
        })

      if (insertError) throw insertError

      setFormData({
        title: '',
        candidate_email: '',
        scheduled_at: '',
        mode: 'practice',
      })
      
      onSuccess?.()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create interview')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule Interview</CardTitle>
        <CardDescription>Create a new interview session</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Interview Title"
            placeholder="Frontend Developer Interview"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          
          <Input
            label="Candidate Email"
            type="email"
            placeholder="candidate@example.com"
            value={formData.candidate_email}
            onChange={(e) => setFormData({ ...formData, candidate_email: e.target.value })}
            required
          />
          
          <Input
            label="Scheduled Date & Time"
            type="datetime-local"
            value={formData.scheduled_at}
            onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
            required
          />
          
          <Select
            label="Interview Mode"
            value={formData.mode}
            onChange={(e) => setFormData({ ...formData, mode: e.target.value as InterviewMode })}
            options={[
              { value: 'practice', label: 'Practice (AI Mock Interview)' },
              { value: 'live', label: 'Live (Google Meet)' },
            ]}
          />
          
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          
          <Button type="submit" loading={loading} className="w-full">
            Create Interview
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

