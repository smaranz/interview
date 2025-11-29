'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export function UpgradeButton() {
  const router = useRouter()
  return (
    <Button 
      variant="outline" 
      className="border-white/10 hover:bg-white/5 text-white"
      onClick={() => router.push('/pricing')}
    >
      Upgrade Plan
    </Button>
  )
}

export function BuyCreditsButton() {
  const router = useRouter()
  return (
    <Button 
      variant="outline" 
      className="border-white/10 hover:bg-white/5 text-white"
      onClick={() => router.push('/pricing')}
    >
      Buy More
    </Button>
  )
}

export function CancelSubscriptionButton() {
  return (
    <Button 
      variant="destructive" 
      className="bg-red-900/20 text-red-400 hover:bg-red-900/40 border border-red-900/50"
      onClick={() => alert('Please email support@preppo.ai to cancel your subscription.')}
    >
      Cancel Subscription
    </Button>
  )
}

