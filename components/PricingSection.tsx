'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Star, Zap, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PricingPlan {
  name: string
  price: string
  credits: number
  pricePerCredit: string
  description: string
  features: string[]
  icon: React.ReactNode
  popular?: boolean
  buttonText: string
  buttonVariant?: 'default' | 'outline'
}

const plans: PricingPlan[] = [
  {
    name: 'Pro',
    price: '$50',
    credits: 100,
    pricePerCredit: '$0.50',
    description: 'Perfect for regular practice',
    features: [
      '100 credits per month',
      '10-minute interviews (15 credits)',
      '25-minute interviews (30 credits)',
      'Post-interview feedback',
      'Email support',
    ],
    icon: <Zap className="h-6 w-6" />,
    buttonText: 'Subscribe to Pro',
    buttonVariant: 'outline',
  },
  {
    name: 'Ultra',
    price: '$150',
    credits: 300,
    pricePerCredit: '$0.50',
    description: 'Best value for serious practice',
    features: [
      '300 credits per month',
      '10-minute interviews (15 credits)',
      '25-minute interviews (30 credits)',
      'Post-interview feedback',
      'Priority support',
      'Advanced analytics',
    ],
    icon: <Star className="h-6 w-6" />,
    popular: true,
    buttonText: 'Subscribe to Ultra',
  },
]

export function PricingSection() {
  const [selectedCredits, setSelectedCredits] = useState(10)

  const handlePlanSelect = (plan: PricingPlan) => {
    // TODO: Integrate with Stripe
    console.log('Selected plan:', plan.name)
    alert(`Stripe integration coming soon! You selected the ${plan.name} plan.`)
  }

  const handleCreditPurchase = (amount: number) => {
    // TODO: Integrate with Stripe
    const totalPrice = (amount * 0.75).toFixed(2)
    console.log(`Purchase ${amount} credits for $${totalPrice}`)
    alert(`Stripe integration coming soon! Purchase ${amount} credits for $${totalPrice}`)
  }

  return (
    <div className="space-y-16">
      {/* Monthly Plans */}
      <div>
        <h2 className="text-2xl font-bold text-center mb-8">Monthly Plans</h2>
        <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={cn(
                'relative flex flex-col',
                plan.popular && 'border-primary shadow-lg scale-105'
              )}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn(
                    'p-2 rounded-lg',
                    plan.popular ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}>
                    {plan.icon}
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {plan.credits} credits ({plan.pricePerCredit} per credit)
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.buttonVariant}
                  onClick={() => handlePlanSelect(plan)}
                >
                  {plan.buttonText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Individual Credits */}
      <div>
        <h2 className="text-2xl font-bold text-center mb-8">Buy Individual Credits</h2>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-muted">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>Pay As You Go</CardTitle>
                <CardDescription>$0.75 per credit</CardDescription>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                Purchase credits individually without a subscription. Credits never expire.
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Number of Credits
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 25, 50, 100].map((amount) => (
                    <Button
                      key={amount}
                      variant={selectedCredits === amount ? 'default' : 'outline'}
                      onClick={() => setSelectedCredits(amount)}
                      className="w-full"
                    >
                      {amount}
                    </Button>
                  ))}
                </div>
                <div className="mt-4">
                  <input
                    type="number"
                    min="1"
                    value={selectedCredits}
                    onChange={(e) => setSelectedCredits(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-4 py-2 border rounded-md bg-background"
                    placeholder="Custom amount"
                  />
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total:</span>
                  <span className="text-2xl font-bold">
                    ${(selectedCredits * 0.75).toFixed(2)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedCredits} credits × $0.75 = ${(selectedCredits * 0.75).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => handleCreditPurchase(selectedCredits)}
            >
              Purchase {selectedCredits} Credits
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Credit Usage Info */}
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>How Credits Work</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">10-Minute Interview</h3>
                <p className="text-sm text-muted-foreground">
                  Costs 15 credits. Perfect for quick practice sessions.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">25-Minute Interview</h3>
                <p className="text-sm text-muted-foreground">
                  Costs 30 credits. Comprehensive practice with detailed feedback.
                </p>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Credits from monthly plans are added at the start of each billing cycle. 
                Individual credits are added immediately after purchase. All credits can be used for either 
                interview duration type.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

