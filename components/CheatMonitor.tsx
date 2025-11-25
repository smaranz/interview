'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Eye, Volume2, Monitor, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CheatMetrics {
  eyeContact: number
  audioLevel: number
  tabFocus: boolean
  overallScore: number
}

interface CheatMonitorProps {
  isActive?: boolean
  className?: string
}

export function CheatMonitor({ isActive = true, className }: CheatMonitorProps) {
  const [metrics, setMetrics] = useState<CheatMetrics>({
    eyeContact: 85,
    audioLevel: 70,
    tabFocus: true,
    overallScore: 82,
  })

  useEffect(() => {
    if (!isActive) return

    const interval = setInterval(() => {
      setMetrics({
        eyeContact: Math.min(100, Math.max(40, metrics.eyeContact + (Math.random() - 0.5) * 20)),
        audioLevel: Math.min(100, Math.max(20, metrics.audioLevel + (Math.random() - 0.5) * 30)),
        tabFocus: Math.random() > 0.1,
        overallScore: Math.min(100, Math.max(50, metrics.overallScore + (Math.random() - 0.5) * 10)),
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [isActive, metrics])

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500'
    if (score >= 60) return 'text-amber-500'
    return 'text-red-500'
  }

  const getBarColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500'
    if (score >= 60) return 'bg-amber-500'
    return 'bg-red-500'
  }

  return (
    <div className={cn('rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900', className)}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn('h-2 w-2 rounded-full', isActive ? 'animate-pulse bg-emerald-500' : 'bg-zinc-400')} />
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Integrity Monitor
          </span>
        </div>
        <div className={cn('text-2xl font-bold', getScoreColor(metrics.overallScore))}>
          {Math.round(metrics.overallScore)}%
        </div>
      </div>

      <div className="space-y-3">
        <MetricRow
          icon={Eye}
          label="Eye Contact"
          value={metrics.eyeContact}
          barColor={getBarColor(metrics.eyeContact)}
        />
        <MetricRow
          icon={Volume2}
          label="Audio Level"
          value={metrics.audioLevel}
          barColor={getBarColor(metrics.audioLevel)}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <Monitor className="h-4 w-4" />
            <span>Tab Focus</span>
          </div>
          <div className="flex items-center gap-1.5">
            {metrics.tabFocus ? (
              <>
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium text-emerald-500">Active</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-500">Away</span>
              </>
            )}
          </div>
        </div>
      </div>

      {metrics.overallScore < 60 && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
          <p className="text-sm text-red-700 dark:text-red-400">
            Low integrity score detected. Please maintain eye contact and stay focused.
          </p>
        </div>
      )}
    </div>
  )
}

function MetricRow({
  icon: Icon,
  label,
  value,
  barColor,
}: {
  icon: typeof Eye
  label: string
  value: number
  barColor: string
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
          <Icon className="h-4 w-4" />
          <span>{label}</span>
        </div>
        <span className="font-medium text-zinc-900 dark:text-zinc-100">{Math.round(value)}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

