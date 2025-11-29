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
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {session.job_title || 'Practice Interview'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-white/50">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(session.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {session.duration}
                    </div>
                    {session.score !== null && (
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-white/80 font-medium">{session.score}%</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <a
                    href={session.job_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-2"
                  >
                    View Job Posting
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <Badge 
                    variant={session.score !== null ? 'default' : 'secondary'}
                    className="bg-white/10 text-white/80 border-white/20"
                  >
                    {session.score !== null ? 'Feedback Available' : 'No Feedback'}
                  </Badge>
                </div>
              </div>
              
              <Link href={`/practice/${session.id}`}>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/30"
                >
                  View Details
                  <ArrowRight className="ml-2 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
