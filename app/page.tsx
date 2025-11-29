'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
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
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } },
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white selection:bg-purple-500/30">
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
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-medium">New: AI Voice Interviews</span>
              <div className="ml-1 h-4 w-[1px] bg-white/20" />
              <span className="flex items-center gap-1 text-white/50">
                Try for free <ArrowRight className="h-3 w-3" />
              </span>
            </motion.div>
            
            <motion.h1 variants={item} className="text-5xl font-bold tracking-tight sm:text-7xl lg:text-8xl bg-gradient-to-br from-white via-white to-white/50 bg-clip-text text-transparent pb-4">
              Master your <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">next interview</span>
            </motion.h1>
            
            <motion.p variants={item} className="mt-6 text-lg text-white/60 leading-relaxed max-w-2xl mx-auto lg:mx-0 lg:text-xl">
              Turn any job posting into a personalized mock interview. Our AI studies the role,
              stays in character, and gives you actionable feedback to help you land the job.
            </motion.p>
            
            <motion.div variants={item} className="mt-10 flex flex-col gap-4 sm:flex-row justify-center lg:justify-start">
              <Link href="/auth/signup">
                <Button className="h-12 w-full rounded-full bg-white px-8 text-base font-semibold text-black transition-all hover:bg-white/90 hover:scale-105 sm:w-auto shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                  Get Started Free
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
            
            <motion.div variants={item} className="mt-12 flex items-center justify-center gap-8 lg:justify-start grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
               {/* Trust badges or stats could go here */}
               <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-8 w-8 rounded-full border-2 border-black bg-white/10" />
                ))}
               </div>
               <div className="text-sm font-medium text-white/40">
                 Trusted by 10,000+ candidates
               </div>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.5, type: "spring" }}
            className="flex-1 relative hidden lg:block"
          >
            {/* Glassmorphic Interface Mockup */}
            <div className="relative rounded-3xl border border-white/10 bg-black/40 p-2 shadow-2xl backdrop-blur-xl">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-xl opacity-50" />
              
              <div className="relative rounded-2xl border border-white/5 bg-black/50 p-6 overflow-hidden">
                 {/* Header */}
                 <div className="flex items-center justify-between mb-8">
                   <div className="flex items-center gap-3">
                     <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <Video className="h-5 w-5 text-white" />
                     </div>
                     <div>
                       <h3 className="text-lg font-semibold text-white">Product Manager</h3>
                       <p className="text-xs text-white/50">Mock Interview • 25m remaining</p>
                     </div>
                   </div>
                   <div className="flex gap-2">
                     <span className="h-3 w-3 rounded-full bg-red-500/50" />
                     <span className="h-3 w-3 rounded-full bg-yellow-500/50" />
                     <span className="h-3 w-3 rounded-full bg-green-500/50" />
                   </div>
                 </div>

                 {/* Chat Area */}
                 <div className="space-y-6">
                   <div className="flex gap-4">
                     <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex-shrink-0 flex items-center justify-center border border-indigo-500/30">
                       <Sparkles className="h-4 w-4 text-indigo-400" />
                     </div>
                     <div className="flex-1 space-y-2">
                       <p className="text-sm text-indigo-200/80">AI Interviewer</p>
                       <div className="rounded-2xl rounded-tl-none border border-white/5 bg-white/5 p-4 text-white/90 shadow-sm">
                         <p>Can you describe a time when you had to make a difficult product tradeoff decision? What was your framework?</p>
                       </div>
                     </div>
                   </div>

                   <div className="flex gap-4 flex-row-reverse">
                     <div className="h-8 w-8 rounded-full bg-white/10 flex-shrink-0 border border-white/10" />
                     <div className="flex-1 space-y-2 text-right">
                       <p className="text-sm text-white/40">You</p>
                       <div className="rounded-2xl rounded-tr-none bg-gradient-to-br from-indigo-600 to-purple-700 p-4 text-white shadow-lg shadow-indigo-500/10">
                         <p>In my last role, I used the RICE scoring model to prioritize...</p>
                         <div className="mt-2 flex gap-1 justify-end">
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }} />
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>

                 {/* Stats Overlay */}
                 <div className="mt-8 grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur-md">
                      <p className="text-xs text-white/40 mb-1">Confidence Score</p>
                      <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-white">92</span>
                        <span className="text-xs text-emerald-400 mb-1">↑ 4%</span>
                      </div>
                      <div className="mt-2 h-1 w-full rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full w-[92%] bg-emerald-500 rounded-full" />
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur-md">
                      <p className="text-xs text-white/40 mb-1">Clarity</p>
                      <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-white">8.5</span>
                        <span className="text-xs text-emerald-400 mb-1">/ 10</span>
                      </div>
                       <div className="mt-2 h-1 w-full rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full w-[85%] bg-blue-500 rounded-full" />
                      </div>
                    </div>
                 </div>
              </div>
            </div>
            
            {/* Floating elements */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-8 top-20 rounded-xl border border-white/10 bg-black/60 p-4 shadow-xl backdrop-blur-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20 text-green-400">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Great answer!</p>
                  <p className="text-xs text-white/50">STAR method applied</p>
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
              Everything you need to <span className="text-indigo-400">succeed</span>
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
         <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/20 to-transparent pointer-events-none" />
          <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
             <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-center">
               <div>
                 <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                   Why practice with <span className="text-indigo-400">Honest Hire?</span>
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
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                      <span className="text-white/80">{feature}</span>
                    </motion.div>
                  ))}
                 </div>
                 <div className="mt-10">
                   <Link href="/auth/signup">
                    <Button size="lg" className="rounded-full px-8 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25">
                      Start Practicing Now
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                   </Link>
                 </div>
               </div>
               <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-20 blur-2xl rounded-full" />
                  <div className="relative rounded-2xl border border-white/10 bg-black/80 p-2 shadow-2xl">
                     <div className="aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 to-black relative group cursor-pointer">
                        <div className="absolute inset-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                           <div className="h-20 w-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                             <Video className="h-8 w-8 text-white ml-1" />
                           </div>
                        </div>
                        <div className="absolute bottom-4 left-4 right-4">
                           <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                             <div className="h-full w-1/3 bg-indigo-500" />
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
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <Video className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-white">
              Honest Hire
            </span>
          </div>
          <p className="text-sm text-white/40">
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
    <motion.div 
      whileHover={{ y: -5 }}
      className="group relative rounded-2xl border border-white/10 bg-white/5 p-8 transition-all hover:bg-white/10 hover:shadow-2xl hover:shadow-indigo-500/10"
    >
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-500/0 via-indigo-500/0 to-purple-500/0 opacity-0 transition-opacity duration-500 group-hover:from-indigo-500/10 group-hover:via-purple-500/5 group-hover:to-purple-500/0 group-hover:opacity-100 rounded-2xl" />
      
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10 transition-colors group-hover:bg-white/10 group-hover:ring-white/20">
        <Icon className="h-7 w-7 text-white/80 group-hover:text-white" />
      </div>
      <h3 className="mb-3 text-xl font-semibold text-white">{title}</h3>
      <p className="text-white/60 leading-relaxed">{description}</p>
    </motion.div>
  )
}

