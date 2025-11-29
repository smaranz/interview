import { PricingSection } from '@/components/PricingSection'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 tracking-tight sm:text-5xl">Pricing Plans</h1>
          <p className="text-xl text-white/60">
            Choose the plan that works best for your interview practice needs
          </p>
        </div>
        <PricingSection />
      </div>
    </div>
  )
}

