'use client'

export interface CheatMetrics {
  tabFocused: boolean
  faceDetected: boolean
  multipleFaces: boolean
  lookingAway: boolean
  timestamp: number
}

export interface CheatEvent {
  type: 'tab_switch' | 'face_lost' | 'multiple_faces' | 'looking_away' | 'tab_return' | 'face_return'
  timestamp: number
  duration?: number
}

export class CheatDetectionService {
  private isActive = false
  private tabFocused = true
  private tabSwitchStart: number | null = null
  private events: CheatEvent[] = []
  private onMetricsUpdate: ((metrics: CheatMetrics) => void) | null = null
  private onEvent: ((event: CheatEvent) => void) | null = null
  private faceDetected = true
  private lastFaceLostTime: number | null = null

  constructor() {
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this)
    this.handleBlur = this.handleBlur.bind(this)
    this.handleFocus = this.handleFocus.bind(this)
  }

  start(
    onMetricsUpdate: (metrics: CheatMetrics) => void,
    onEvent: (event: CheatEvent) => void
  ) {
    this.isActive = true
    this.onMetricsUpdate = onMetricsUpdate
    this.onEvent = onEvent
    this.events = []
    this.tabFocused = true
    this.faceDetected = true

    document.addEventListener('visibilitychange', this.handleVisibilityChange)
    window.addEventListener('blur', this.handleBlur)
    window.addEventListener('focus', this.handleFocus)

    this.emitMetrics()
  }

  stop() {
    this.isActive = false
    this.onMetricsUpdate = null
    this.onEvent = null

    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
    window.removeEventListener('blur', this.handleBlur)
    window.removeEventListener('focus', this.handleFocus)
  }

  private handleVisibilityChange() {
    if (document.hidden) {
      this.handleTabLeave()
    } else {
      this.handleTabReturn()
    }
  }

  private handleBlur() {
    this.handleTabLeave()
  }

  private handleFocus() {
    this.handleTabReturn()
  }

  private handleTabLeave() {
    if (!this.tabFocused) return
    
    this.tabFocused = false
    this.tabSwitchStart = Date.now()
    
    const event: CheatEvent = {
      type: 'tab_switch',
      timestamp: Date.now(),
    }
    this.events.push(event)
    this.onEvent?.(event)
    this.emitMetrics()
  }

  private handleTabReturn() {
    if (this.tabFocused) return
    
    this.tabFocused = true
    const duration = this.tabSwitchStart ? Date.now() - this.tabSwitchStart : 0
    this.tabSwitchStart = null
    
    const event: CheatEvent = {
      type: 'tab_return',
      timestamp: Date.now(),
      duration,
    }
    this.events.push(event)
    this.onEvent?.(event)
    this.emitMetrics()
  }

  updateFaceDetection(detected: boolean, multipleFaces: boolean = false, lookingAway: boolean = false) {
    if (!this.isActive) return

    if (!detected && this.faceDetected) {
      this.lastFaceLostTime = Date.now()
      const event: CheatEvent = {
        type: 'face_lost',
        timestamp: Date.now(),
      }
      this.events.push(event)
      this.onEvent?.(event)
    } else if (detected && !this.faceDetected) {
      const duration = this.lastFaceLostTime ? Date.now() - this.lastFaceLostTime : 0
      this.lastFaceLostTime = null
      const event: CheatEvent = {
        type: 'face_return',
        timestamp: Date.now(),
        duration,
      }
      this.events.push(event)
      this.onEvent?.(event)
    }

    if (multipleFaces) {
      const event: CheatEvent = {
        type: 'multiple_faces',
        timestamp: Date.now(),
      }
      this.events.push(event)
      this.onEvent?.(event)
    }

    if (lookingAway && detected) {
      const event: CheatEvent = {
        type: 'looking_away',
        timestamp: Date.now(),
      }
      this.events.push(event)
      this.onEvent?.(event)
    }

    this.faceDetected = detected
    this.emitMetrics()
  }

  private emitMetrics() {
    if (!this.onMetricsUpdate) return

    this.onMetricsUpdate({
      tabFocused: this.tabFocused,
      faceDetected: this.faceDetected,
      multipleFaces: false,
      lookingAway: false,
      timestamp: Date.now(),
    })
  }

  getEvents(): CheatEvent[] {
    return [...this.events]
  }

  getIntegrityScore(): number {
    if (this.events.length === 0) return 100

    let score = 100
    for (const event of this.events) {
      switch (event.type) {
        case 'tab_switch':
          score -= 5
          if (event.duration && event.duration > 5000) {
            score -= Math.floor(event.duration / 5000) * 3
          }
          break
        case 'face_lost':
          score -= 3
          if (event.duration && event.duration > 3000) {
            score -= Math.floor(event.duration / 3000) * 2
          }
          break
        case 'multiple_faces':
          score -= 15
          break
        case 'looking_away':
          score -= 2
          break
      }
    }

    return Math.max(0, Math.min(100, score))
  }
}

export const cheatDetectionService = new CheatDetectionService()

