import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, User, Shield } from 'lucide-react'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

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
                {profile?.full_name || 'Not set'}
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
              <Button variant="outline" className="border-white/10 hover:bg-white/5 text-white">
                Upgrade Plan
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
              <div>
                <div className="font-medium text-white">Available Credits</div>
                <div className="text-sm text-white/60">{profile?.credits || 0} credits remaining</div>
              </div>
              <Button variant="outline" className="border-white/10 hover:bg-white/5 text-white">
                Buy More
              </Button>
            </div>

            <div className="pt-4 border-t border-white/10">
              <h4 className="text-sm font-medium text-white mb-4">Danger Zone</h4>
              <Button variant="destructive" className="bg-red-900/20 text-red-400 hover:bg-red-900/40 border border-red-900/50">
                Cancel Subscription
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

