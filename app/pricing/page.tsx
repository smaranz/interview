import { PricingSection } from '@/components/PricingSection'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Pricing Plans</h1>
          <p className="text-xl text-muted-foreground">
            Choose the plan that works best for your interview practice needs
          </p>
        </div>
        <PricingSection />
      </div>
    </div>
  )
}

