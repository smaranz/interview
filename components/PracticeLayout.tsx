'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Loader2, Volume2, VolumeX, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { cheatDetectionService, type CheatEvent, type CheatMetrics } from '@/lib/cheat-detection'
import { OpenAIRealtimeClient } from '@/lib/openai-realtime'

interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function PracticeLayout() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(true) // Controls local mic mute for video call simulation
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [messages, setMessages] = useState<AIMessage[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected')
  
  // Setup state
  const [jobDescription, setJobDescription] = useState('')
  const [jobUrl, setJobUrl] = useState('')
  
  const liveClientRef = useRef<OpenAIRealtimeClient | null>(null)
  
  // Cheat detection state
  const [, setCheatMetrics] = useState<CheatMetrics | null>(null)
  const [cheatEvents, setCheatEvents] = useState<CheatEvent[]>([])

  const startMedia = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true, // Local audio for video preview
      })
      setStream(mediaStream)
    } catch (error) {
      console.error('Failed to access media devices:', error)
    }
  }, [])

  // Ensure video plays when stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
      videoRef.current.play().catch(console.error)
    }
  }, [stream, isSessionActive])

  const stopMedia = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
  }, [stream])

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setVideoEnabled(videoTrack.enabled)
      }
    }
  }

  const toggleAudio = () => {
    // This toggles local mic for the video preview
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setAudioEnabled(audioTrack.enabled)
      }
    }
    // Also toggle mute on the live client if connected (not implemented in simple client yet)
  }

  const startSession = async () => {
    if (!jobDescription.trim()) {
      alert('Please enter a job description to start.')
      return
    }

    await startMedia()
    setIsSessionActive(true)
    
    // Start cheat detection
    cheatDetectionService.start(
      (metrics) => setCheatMetrics(metrics),
      (event) => {
        setCheatEvents(prev => [...prev, event])
        console.log('Cheat event detected:', event)
      }
    )

    // Start OpenAI Realtime client
    if (!liveClientRef.current) {
      liveClientRef.current = new OpenAIRealtimeClient({
        model: 'gpt-realtime-mini',
        voice: 'marin'
      })

      liveClientRef.current.onStatusChange = (status) => setConnectionStatus(status)
      liveClientRef.current.onTextData = (text) => {
        if (!text) return
        setMessages(prev => [
          ...prev,
          {
            id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
            role: 'assistant',
            content: text,
            timestamp: new Date()
          }
        ])
      }
      liveClientRef.current.onError = (error) => {
        console.error('OpenAI Realtime error:', error)
        setConnectionStatus('disconnected')
      }
    }

    const systemInstruction = `You are a professional AI interviewer conducting a practice job interview. 
The candidate is applying for the following role:
${jobDescription.trim()}
${jobUrl ? `Job Link: ${jobUrl}` : ''}

Your role is to:
1. Ask thoughtful, relevant interview questions based on the job description provided.
2. Listen to the candidate's responses and provide brief, constructive feedback.
3. Follow up on interesting points the candidate makes.
4. Maintain a professional but friendly tone.
5. Keep responses concise (2-3 sentences max) to keep the conversation flowing naturally.

Start by introducing yourself briefly and asking the first question related to the job description. Focus on behavioral and situational questions relevant to this specific role.
Speak naturally as if in a real video call.`

    try {
      await liveClientRef.current.connect(systemInstruction)
    } catch (err) {
      console.error('Failed to start realtime session:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      alert(`Failed to start the AI interview: ${errorMessage}\n\nPlease check:\n1. OpenAI API key is configured in Vercel\n2. Your browser console for more details`)
      cheatDetectionService.stop()
      stopMedia()
      liveClientRef.current?.disconnect()
      liveClientRef.current = null
      setIsSessionActive(false)
      return
    }
  }

  const endSession = () => {
    stopMedia()
    cheatDetectionService.stop()
    
    if (liveClientRef.current) {
      liveClientRef.current.disconnect()
      liveClientRef.current = null
    }
    
    const finalScore = cheatDetectionService.getIntegrityScore()
    console.log('Session ended. Integrity score:', finalScore)
    console.log('Cheat events:', cheatEvents)
    
    setIsSessionActive(false)
    setMessages([])
    setCheatEvents([])
    // Reset client to allow re-init with new job desc if needed
    liveClientRef.current = null 
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    return () => {
      stopMedia()
      cheatDetectionService.stop()
      liveClientRef.current?.disconnect()
    }
  }, [stopMedia])

  if (!isSessionActive) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-800">
              <Briefcase className="h-8 w-8 text-neutral-200" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-white">
              Setup Interview Context
            </h2>
            <p className="text-neutral-400">
              Paste the job description from LinkedIn to tailor the AI interview.
            </p>
          </div>

          <div className="space-y-4 rounded-lg border border-neutral-800 bg-neutral-900 p-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-200">Job URL (Optional)</label>
              <Input 
                placeholder="https://linkedin.com/jobs/..."
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-200">Job Description</label>
              <Textarea 
                placeholder="Paste the full job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-[200px] bg-neutral-800 border-neutral-700 text-white resize-none"
              />
            </div>

            <Button 
              size="lg" 
              onClick={startSession}
              disabled={!jobDescription.trim()}
              className="w-full bg-white text-black hover:bg-neutral-200"
            >
              Start Live Session
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] gap-6">
      {/* Video Section - Full Width for Immersive Experience */}
      <div className="flex flex-1 flex-col">
        <div 
          ref={videoContainerRef}
          className="relative flex-1 overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900"
        >
          {/* Video Element with Explicit Play Handling */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted // Mute local playback to avoid echo
            onCanPlay={() => videoRef.current?.play()}
            className={cn(
              'absolute inset-0 h-full w-full object-cover',
              !videoEnabled && 'hidden'
            )}
          />
          {!videoEnabled && (
            <div className="flex h-full w-full items-center justify-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-neutral-800">
                <VideoOff className="h-10 w-10 text-neutral-400" />
              </div>
            </div>
          )}

          {/* Status Indicators */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <div className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 text-white backdrop-blur",
              connectionStatus === 'connected' ? "bg-emerald-500/80" : "bg-amber-500/80"
            )}>
              {connectionStatus === 'connecting' && <Loader2 className="h-4 w-4 animate-spin" />}
              {connectionStatus === 'connected' && <Volume2 className="h-4 w-4" />}
              <span className="text-sm font-medium">
                {connectionStatus === 'connected' ? 'Live Voice Active' : 'Connecting...'}
              </span>
            </div>
          </div>

          {/* Controls overlay */}
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleAudio}
              className={cn(
                'h-12 w-12 rounded-full transition-colors',
                audioEnabled 
                  ? 'bg-neutral-800 text-white hover:bg-neutral-700' 
                  : 'bg-red-600 text-white hover:bg-red-700'
              )}
            >
              {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleVideo}
              className={cn(
                'h-12 w-12 rounded-full',
                videoEnabled 
                  ? 'bg-neutral-800 text-white hover:bg-neutral-700' 
                  : 'bg-red-600 text-white hover:bg-red-700'
              )}
            >
              {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={endSession}
              className="h-12 w-12 rounded-full bg-red-600 text-white hover:bg-red-700"
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Sidebar can be used for transcript later or notes */}
      <div className="hidden w-80 flex-col rounded-lg border border-neutral-800 bg-neutral-900 lg:flex">
        <div className="flex items-center gap-2 border-b border-neutral-800 p-4">
          <MessageSquare className="h-5 w-5 text-neutral-400" />
          <span className="font-medium text-white">Session Notes</span>
        </div>
        <div className="flex-1 p-4 text-sm text-neutral-400">
          <p>The AI is listening and speaking in real-time.</p>
          <p className="mt-4">Focus on maintaining eye contact and speaking clearly.</p>
          {jobUrl && (
             <p className="mt-4 text-xs text-neutral-500 truncate">
               Context: {jobUrl}
             </p>
          )}
        </div>
      </div>
    </div>
  )
}
