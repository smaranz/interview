'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
          <div className="space-y-2">
            <label className="text-sm font-medium">Interview Title</label>
            <Input
              placeholder="Frontend Developer Interview"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Candidate Email</label>
            <Input
              type="email"
              placeholder="candidate@example.com"
              value={formData.candidate_email}
              onChange={(e) => setFormData({ ...formData, candidate_email: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Scheduled Date & Time</label>
            <Input
              type="datetime-local"
              value={formData.scheduled_at}
              onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Interview Mode</label>
            <Select
              value={formData.mode}
              onValueChange={(value: InterviewMode) => setFormData({ ...formData, mode: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="practice">Practice (AI Mock Interview)</SelectItem>
                <SelectItem value="live">Live (Google Meet)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Creating...' : 'Create Interview'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
