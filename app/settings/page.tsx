'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { CreditCard, User } from 'lucide-react'
import { UpgradeButton, BuyCreditsButton, CancelSubscriptionButton } from './SettingsActions'

interface Profile {
  full_name: string | null
  credits: number
}

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
      return
    }

    if (user) {
      fetchProfile()
    }
  }, [user, loading, router])

  const fetchProfile = async () => {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('profiles')
        .select('full_name, credits')
        .eq('id', user!.uid)
        .single()
      
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setDataLoading(false)
    }
  }

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-white/60">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-12">
      <div className="mx-auto max-w-3xl px-6 lg:px-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
          <p className="mt-2 text-white/60">Manage your profile and subscription.</p>
        </div>

        <Card className="bg-neutral-900 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-1">
              <label className="text-sm font-medium text-white/60">Email</label>
              <div className="p-3 rounded-md bg-white/5 border border-white/10 text-white">
                {user.email}
              </div>
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium text-white/60">Full Name</label>
              <div className="p-3 rounded-md bg-white/5 border border-white/10 text-white">
                {profile?.full_name || user.displayName || 'Not set'}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <CreditCard className="h-5 w-5" />
              Subscription & Credits
            </CardTitle>
            <CardDescription className="text-white/40">
              Manage your plan and billing details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
              <div>
                <div className="font-medium text-white">Current Plan</div>
                <div className="text-sm text-white/60">Free Tier</div>
              </div>
              <UpgradeButton />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
              <div>
                <div className="font-medium text-white">Available Credits</div>
                <div className="text-sm text-white/60">{profile?.credits || 0} credits remaining</div>
              </div>
              <BuyCreditsButton />
            </div>

            <div className="pt-4 border-t border-white/10">
              <h4 className="text-sm font-medium text-white mb-4">Danger Zone</h4>
              <CancelSubscriptionButton />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
