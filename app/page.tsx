import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Video, Shield, Zap, Users, ArrowRight, CheckCircle } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-sm font-medium text-secondary-foreground">
              <Zap className="h-4 w-4" />
              Practice Interview Platform for Job Seekers
            </div>
            
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Practice Interviews with{' '}
              <span className="text-muted-foreground">
                AI-Powered Feedback
              </span>
            </h1>
            
            <p className="mb-10 text-lg text-muted-foreground sm:text-xl">
              Master your interview skills with AI-powered practice sessions. Get personalized feedback, 
              improve your answers, and build confidence before your real interviews.
            </p>
            
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/auth/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-muted-foreground">
              Practice, improve, and ace your next interview
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={Video}
              title="AI Practice Sessions"
              description="Practice with our AI interviewer Alex who adapts to your responses and provides real-time feedback tailored to your job application."
            />
            <FeatureCard
              icon={Shield}
              title="Personalized Feedback"
              description="Get detailed feedback after each practice session including your score, strengths, areas for improvement, and study recommendations."
            />
            <FeatureCard
              icon={Users}
              title="Job-Specific Questions"
              description="Paste any job posting link and our AI will ask relevant questions based on that specific role and requirements."
            />
          </div>
        </div>
      </section>

      <section className="border-t border-border py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="mb-6 text-3xl font-bold">
                Why Practice with Honest Hire?
              </h2>
              <div className="space-y-4">
                {[
                  'AI-powered mock interviews tailored to your job application',
                  'Get instant feedback on your performance and answers',
                  'Practice with questions specific to the role you\'re applying for',
                  'Build confidence before your real interviews',
                  'Identify areas to improve with personalized study recommendations',
                ].map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-foreground" />
                    <span className="text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-8">
                <Link href="/auth/signup">
                  <Button size="lg">
                    Start Practicing Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-video overflow-hidden rounded-lg border border-border bg-secondary">
                <div className="flex h-full items-center justify-center">
                  <Video className="h-20 w-20 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-12">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground">
              <Video className="h-4 w-4 text-background" />
            </div>
            <span className="text-lg font-semibold">
              Honest Hire
            </span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            © {new Date().getFullYear()} Honest Hire. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Video
  title: string
  description: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 transition-colors hover:bg-accent">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-secondary">
        <Icon className="h-6 w-6 text-secondary-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
