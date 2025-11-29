'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { motion, type Variants } from 'framer-motion'
import { NebulaBackground } from '@/components/NebulaBackground'
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
  PlayCircle,
} from 'lucide-react'

export default function Home() {
  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  }

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { type: "spring", stiffness: 50 } 
    },
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white selection:bg-white/20">
      <NebulaBackground />
      
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32">
        <div className="relative mx-auto flex max-w-7xl flex-col gap-16 px-6 lg:flex-row lg:items-center lg:px-8">
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="flex-1 text-center lg:text-left"
          >
            <motion.div variants={item} className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 backdrop-blur-md transition-colors hover:bg-white/10 hover:border-white/20">
              <span className="flex h-2 w-2 rounded-full bg-white animate-pulse" />
              <span className="font-medium">New: AI Voice Interviews</span>
              <div className="ml-1 h-4 w-[1px] bg-white/20" />
              <span className="flex items-center gap-1 text-white/50">
                Get started <ArrowRight className="h-3 w-3" />
              </span>
            </motion.div>
            
            <motion.h1 variants={item} className="text-5xl font-bold tracking-tight sm:text-7xl lg:text-8xl bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent pb-4">
              Master your <br />
              <span className="text-white">next interview</span>
            </motion.h1>
            
            <motion.p variants={item} className="mt-6 text-lg text-white/60 leading-relaxed max-w-2xl mx-auto lg:mx-0 lg:text-xl">
              Turn any job posting into a personalized mock interview. Our AI studies the role,
              stays in character, and gives you actionable feedback to help you land the job.
            </motion.p>
            
            <motion.div variants={item} className="mt-10 flex flex-col gap-4 sm:flex-row justify-center lg:justify-start">
              <Link href="/auth/signup">
                <Button className="h-12 w-full rounded-full bg-white px-8 text-base font-semibold text-black transition-all hover:bg-white/90 hover:scale-105 sm:w-auto shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/practice">
                <Button
                  variant="outline"
                  className="h-12 w-full rounded-full border-white/10 bg-white/5 px-8 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/20 sm:w-auto"
                >
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Watch Demo
                </Button>
              </Link>
            </motion.div>
            
            <motion.div variants={item} className="mt-12 flex items-center justify-center gap-8 lg:justify-start opacity-60">
               <div className="text-sm font-medium text-white/40">
                 Trusted by 10,000+ candidates
               </div>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
            className="flex-1 relative hidden lg:block"
          >
            {/* Glassmorphic Interface Mockup - Video Call Style */}
            <div className="relative rounded-3xl border border-white/10 bg-black/40 p-2 shadow-2xl backdrop-blur-xl">
              <div className="absolute -inset-1 rounded-3xl bg-white/5 blur-xl opacity-50" />
              
              <div className="relative aspect-video rounded-2xl border border-white/5 bg-neutral-900 overflow-hidden flex flex-col">
                 {/* Video Content Area */}
                 <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-20" />
                 
                 {/* Main Avatar Placeholder (User) */}
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-32 w-32 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-sm">
                      <div className="h-24 w-24 rounded-full bg-neutral-800 flex items-center justify-center">
                        <Users className="h-12 w-12 text-white/20" />
                      </div>
                    </div>
                 </div>

                 {/* Status Indicators */}
                 <div className="absolute top-6 right-6 flex flex-col gap-3 z-10">
                   <div className="flex items-center gap-2 rounded-full px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-md">
                     <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                     <span className="text-xs font-medium text-emerald-200">Live Voice Active</span>
                   </div>
                   <div className="flex items-center gap-2 rounded-full px-4 py-2 bg-blue-500/20 border border-blue-500/30 backdrop-blur-md">
                     <Clock className="h-3 w-3 text-blue-200" />
                     <span className="text-xs font-medium text-blue-200">14:20 remaining</span>
                   </div>
                 </div>

                 {/* Controls Bar */}
                 <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-10">
                   <div className="h-12 w-12 rounded-full bg-white/10 border border-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                     <div className="h-5 w-5 text-white" >
                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                     </div>
                   </div>
                   <div className="h-12 w-12 rounded-full bg-white/10 border border-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                     <Video className="h-5 w-5 text-white" />
                   </div>
                   <div className="h-12 w-12 rounded-full bg-red-500/80 border border-red-500/50 backdrop-blur-md flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer shadow-lg shadow-red-500/20">
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/><line x1="23" y1="1" x2="1" y2="23"/></svg>
                   </div>
                 </div>
              </div>
            </div>
            
            {/* Floating elements */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-8 top-20 rounded-xl border border-white/10 bg-black/80 p-4 shadow-xl backdrop-blur-md z-20"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Great articulation!</p>
                  <p className="text-xs text-white/50">AI Feedback</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="relative border-t border-white/5 bg-black/50 py-24 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Everything you need to <span className="text-white/80">succeed</span>
            </h2>
            <p className="mt-4 text-lg text-white/60">
              Comprehensive tools to practice, improve, and ace your next interview
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            <FeatureCard
              icon={Video}
              title="AI Practice Sessions"
              description="Practice with our AI interviewer who adapts to your responses and provides real-time feedback."
            />
            <FeatureCard
              icon={Shield}
              title="Personalized Feedback"
              description="Get detailed feedback after each practice session including your score, strengths, and study plan."
            />
            <FeatureCard
              icon={Users}
              title="Job-Specific Questions"
              description="Paste any job posting link and our AI will ask relevant questions based on that specific role."
            />
          </div>
        </div>
      </section>
      
       <section className="relative py-24">
         <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
          <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
             <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-center">
               <div>
                 <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                   Why practice with <span className="text-white/80">Preppo?</span>
                 </h2>
                 <p className="mt-6 text-lg text-white/60">
                   Most candidates fail because they don't practice out loud. We provide a safe space to fail, learn, and improve before it counts.
                 </p>
                 <div className="mt-8 space-y-4">
                  {[
                    'AI-powered mock interviews tailored to your job application',
                    'Get instant feedback on your performance and answers',
                    'Practice with questions specific to the role',
                    'Build confidence before your real interviews',
                  ].map((feature, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                      <span className="text-white/80">{feature}</span>
                    </motion.div>
                  ))}
                 </div>
                 <div className="mt-10">
                   <Link href="/auth/signup">
                    <Button size="lg" className="rounded-full px-8 bg-white text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                      Start Practicing Now
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                   </Link>
                 </div>
               </div>
               <div className="relative">
                  <div className="absolute -inset-4 bg-white/5 opacity-50 blur-2xl rounded-full" />
                  <div className="relative rounded-2xl border border-white/10 bg-black/80 p-2 shadow-2xl">
                     <div className="aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-neutral-900 to-black relative group cursor-pointer">
                        <div className="absolute inset-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                           <div className="h-20 w-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                             <Video className="h-8 w-8 text-white ml-1" />
                           </div>
                        </div>
                        <div className="absolute bottom-4 left-4 right-4">
                           <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                             <div className="h-full w-1/3 bg-white" />
                           </div>
                           <div className="mt-2 flex justify-between text-xs text-white/60">
                             <span>04:20</span>
                             <span>12:45</span>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
             </div>
          </div>
       </section>

      <footer className="border-t border-white/5 bg-black py-12">
        <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black">
              <Video className="h-4 w-4" />
            </div>
            <span className="text-lg font-semibold text-white">
              Preppo
            </span>
          </div>
          <p className="text-sm text-white/40">
            © {new Date().getFullYear()} Preppo. All rights reserved.
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
    <motion.div 
      whileHover={{ y: -5 }}
      className="group relative rounded-2xl border border-white/10 bg-white/5 p-8 transition-all hover:bg-white/10 hover:shadow-2xl hover:shadow-white/5"
    >
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white/5 via-white/0 to-white/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 rounded-2xl" />
      
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10 transition-colors group-hover:bg-white/10 group-hover:ring-white/20">
        <Icon className="h-7 w-7 text-white/80 group-hover:text-white" />
      </div>
      <h3 className="mb-3 text-xl font-semibold text-white">{title}</h3>
      <p className="text-white/60 leading-relaxed">{description}</p>
    </motion.div>
  )
}
