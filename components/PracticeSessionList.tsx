'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, Calendar, Clock, Star, ArrowRight } from 'lucide-react'
import type { PracticeSession } from '@/lib/practice-sessions'

interface PracticeSessionListProps {
  sessions: PracticeSession[]
}

export function PracticeSessionList({ sessions }: PracticeSessionListProps) {
  if (sessions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/10 bg-white/5 p-16 text-center backdrop-blur-sm"
      >
        <p className="mb-6 text-lg text-white/60">
          No practice sessions yet. Start practicing to see your sessions here!
        </p>
        <Link href="/practice">
          <Button className="rounded-full bg-white px-8 text-black hover:bg-white/90 transition-transform hover:scale-105">
            Start Practicing
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </motion.div>
    )
  }

  return (
    <div className="space-y-4">
      {sessions.map((session, index) => (
        <motion.div
          key={session.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ y: -2 }}
        >
          <div className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:bg-white/10 hover:shadow-xl hover:shadow-white/5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <div>
                  <h3 className="text-lg font-semibold text-white tracking-tight">
                    {session.job_title || 'Practice Interview'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-white/50 mt-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(session.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="h-1 w-1 rounded-full bg-white/20" />
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {session.duration}
                    </div>
                    {session.score !== null && (
                      <>
                        <div className="h-1 w-1 rounded-full bg-white/20" />
                        <div className="flex items-center gap-1.5 text-white/80">
                          <Star className="h-3.5 w-3.5 fill-white/20 text-white/40" />
                          <span className="font-medium">{session.score}%</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <a
                    href={session.job_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-white/40 hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    View Job Posting
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <Badge 
                    variant={session.score !== null ? 'default' : 'secondary'}
                    className="bg-white/5 text-white/60 border-white/10 hover:bg-white/10 px-2 py-0.5 text-[10px] h-5"
                  >
                    {session.score !== null ? 'Feedback Ready' : 'No Feedback'}
                  </Badge>
                </div>
              </div>
              
              <Link href={`/practice/${session.id}`}>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full sm:w-auto rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20 h-9 px-4 text-xs font-medium"
                >
                  View Details
                  <ArrowRight className="ml-2 h-3 w-3 opacity-50" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
