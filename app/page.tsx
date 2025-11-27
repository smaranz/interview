import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Video,
  Shield,
  Zap,
  Users,
  ArrowRight,
  CheckCircle,
  Clock,
  Star,
  Sparkles,
} from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAzNGMwIDIuMjA5LTEuNzkxIDQtNCA0cy00LTEuNzkxLTQtNCAxLjc5MS00IDQtNCA0IDEuNzkxIDQgNHptMCAwYzAtMi4yMDkgMS43OTEtNCA0LTRzNCAxLjc5MSA0IDQtMS43OTEgNC00IDQtNC0xLjc5MS00LTR6IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvZz48L3N2Zz4=')] opacity-20"></div>
        <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16 lg:flex-row lg:items-center lg:px-8">
          <div className="flex-1">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-white/80 backdrop-blur">
              <Sparkles className="h-4 w-4 text-white/60" />
              We just helped 10k candidates practice this week
            </div>
            <h1 className="text-4xl font-bold leading-[1.1] sm:text-5xl lg:text-6xl">
              Meet Honest Hire — your AI interview platform.
            </h1>
            <p className="mt-4 text-lg text-white/70 lg:text-xl">
              Turn any job posting into a personalized mock interview. Our AI studies the role,
              stays in character, and gives you actionable feedback so you can walk into the real
              interview confident and prepared.
            </p>
            <div className="mt-6 flex flex-col gap-4 sm:flex-row">
              <Link href="/auth/signup">
                <Button className="w-full bg-white text-black hover:bg-white/80 sm:w-auto" size="lg">
                  Get Started – It&apos;s Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/practice">
                <Button
                  variant="outline"
                  className="w-full border-white/20 bg-transparent text-white hover:bg-white/10 sm:w-auto"
                  size="lg"
                >
                  See Practice Mode
                </Button>
              </Link>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <StatCard label="Live voice interviews" value="Realtime OpenAI" />
              <StatCard label="Detailed feedback" value="Scores • Strengths • Study plan" />
            </div>
          </div>

          <div className="flex-1">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/70">Practice Session</p>
                  <h3 className="mt-1 text-xl font-semibold text-white">Product Manager Mock Interview</h3>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-white/80">
                  <Clock className="mr-1 inline-flex h-4 w-4" />
                  25 min
                </span>
              </div>

              <div className="mt-4 space-y-4 rounded-2xl bg-black/30 p-4">
                <div>
                  <p className="text-sm text-white/60">AI Interviewer</p>
                  <p className="mt-1 text-base text-white">
                    "Hi, I&apos;ll be conducting your interview today. Let&apos;s start with a quick
                    introduction—tell me about your background and what drew you to this role."
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-sm text-white/80">Key areas we&apos;ll cover</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/70">
                    <li>Leadership in ambiguous environments</li>
                    <li>Metrics mindset for product decisions</li>
                    <li>How you collaborate with engineering</li>
                  </ul>
                </div>
              </div>

              <div className="mt-4 grid gap-4 rounded-2xl border border-white/10 bg-black/40 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-white/60">Score last session</p>
                  <p className="mt-1 text-2xl font-semibold text-white">
                    87
                    <span className="ml-1 text-sm font-normal text-emerald-300">Great progress</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-white/60">Recommendations</p>
                  <p className="mt-1 flex items-center gap-1 text-white">
                    <Star className="h-4 w-4 text-yellow-300" />
                    Deepen your STAR stories
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/5 bg-black py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-muted-foreground">
              Practice, improve, and ace your next interview
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={Video}
              title="AI Practice Sessions"
              description="Practice with our AI interviewer who adapts to your responses and provides real-time feedback tailored to your job application."
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

      <section className="border-t border-white/5 bg-black py-16">
        <div className="mx-auto max-w-6xl px-6 sm:px-8">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <h2 className="mb-5 text-3xl font-bold">
                Why Practice with Honest Hire?
              </h2>
              <div className="space-y-3">
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
              
              <div className="mt-6">
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

      <footer className="border-t border-white/5 bg-black py-12">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white">
              <Video className="h-4 w-4 text-blue-900" />
            </div>
            <span className="text-lg font-semibold text-white">
              Honest Hire
            </span>
          </div>
          <p className="mt-4 text-sm text-white/60">
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
    <div className="rounded-lg border border-white/10 bg-white/5 p-6 transition-colors hover:bg-white/10 backdrop-blur-sm">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-white/10">
        <Icon className="h-6 w-6 text-white/80" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
      <p className="text-white/70">{description}</p>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left backdrop-blur">
      <p className="text-sm text-white/70">{label}</p>
      <p className="mt-1.5 text-lg font-semibold text-white">{value}</p>
    </div>
  )
}
