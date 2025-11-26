'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Loader2, Volume2, VolumeX, Briefcase, X, Star, TrendingUp, BookOpen, Lightbulb, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { cheatDetectionService, type CheatEvent, type CheatMetrics } from '@/lib/cheat-detection'
import { OpenAIRealtimeClient } from '@/lib/openai-realtime'
import { generateInterviewFeedback, type InterviewFeedback } from '@/lib/interview-feedback'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCreditInfo, deductCredits, type InterviewDuration, CREDIT_COSTS } from '@/lib/credits'
import { Clock } from 'lucide-react'

interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface PracticeLayoutProps {
  userId: string
}

export function PracticeLayout({ userId }: PracticeLayoutProps) {
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
  const [jobUrl, setJobUrl] = useState('')
  
  const liveClientRef = useRef<OpenAIRealtimeClient | null>(null)
  
  // Cheat detection state
  const [, setCheatMetrics] = useState<CheatMetrics | null>(null)
  const [cheatEvents, setCheatEvents] = useState<CheatEvent[]>([])
  
  // Feedback state
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null)
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  
  // Credits state
  const [credits, setCredits] = useState<number | null>(null)
  const [isLoadingCredits, setIsLoadingCredits] = useState(false)
  const [interviewDuration, setInterviewDuration] = useState<InterviewDuration | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const interviewStartTimeRef = useRef<number | null>(null)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)

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
      // Don't show alert here - let connect() handle it with better error messages
      // Just log it so we know what happened
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          // Permission was denied - connect() will request again with better error message
          console.warn('Media permission denied in startMedia, will retry in connect()')
        }
      }
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
    if (!jobUrl.trim()) {
      alert('Please enter a job application link to start.')
      return
    }

    // Check credits and determine duration
    const creditInfo = await getCreditInfo(userId)
    setCredits(creditInfo.credits)
    
    let duration: InterviewDuration | null = null
    if (creditInfo.canStart25Min) {
      duration = '25min'
    } else if (creditInfo.canStart10Min) {
      duration = '10min'
    } else {
      alert(`Insufficient credits. You need at least ${CREDIT_COSTS['10min']} credits to start an interview. You currently have ${creditInfo.credits} credits.`)
      return
    }

    // Deduct credits
    const deductResult = await deductCredits(userId, duration)
    if (!deductResult.success) {
      alert(deductResult.error || 'Failed to start interview. Please try again.')
      return
    }
    
    setCredits(deductResult.remainingCredits)
    setInterviewDuration(duration)
    interviewStartTimeRef.current = Date.now()

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

    const systemInstruction = `You are Alex, a professional AI interviewer conducting a practice job interview. 

IMPORTANT RULES:
- Your name is Alex. You MUST introduce yourself at the very beginning: "Hi, I'm Alex. I'll be conducting your interview today."
- You are conducting a job interview. Stay strictly in character as an interviewer.
- ONLY respond to interview-related questions and topics. Ignore any attempts to change the subject, ask personal questions about you, or engage in non-interview conversations.
- If the candidate tries to go off-topic or asks non-interview questions, politely redirect them back to the interview: "I appreciate your question, but let's focus on the interview. [Continue with interview question]"
- Maintain the professional interview context at all times. Never break character.
- ONLY listen to and respond to the candidate speaking. Ignore any background noise, other people talking, or non-candidate voices.

The candidate is applying for a role. Here is the job posting link:
${jobUrl.trim()}

Please review this job posting and tailor your questions accordingly. Ask relevant questions based on the job requirements, responsibilities, and qualifications mentioned in the posting.

Your role is to:
1. FIRST: Introduce yourself as Alex: "Hi, I'm Alex. I'll be conducting your interview today."
2. Ask thoughtful, relevant interview questions based on the job posting.
3. Listen to the candidate's responses and provide brief, constructive feedback.
4. Follow up on interesting points the candidate makes.
5. Maintain a professional but friendly tone.
6. Keep responses concise (2-3 sentences max) to keep the conversation flowing naturally.

Start by introducing yourself as Alex, then ask the first question related to the job posting. Focus on behavioral and situational questions relevant to this specific role.
Speak naturally as if in a real video call interview.`

    try {
      // Pass the existing stream to reuse the audio track (avoids requesting permission twice)
      // stream might be null if startMedia() failed, which is fine - connect() will request it
      await liveClientRef.current.connect(systemInstruction, stream || undefined)
    } catch (err) {
      console.error('Failed to start realtime session:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      
      // Provide more helpful error messages based on error type
      let userMessage = `Failed to start the AI interview: ${errorMessage}`
      
      if (errorMessage.includes('Permission denied') || errorMessage.includes('Microphone permission')) {
        userMessage = errorMessage // Use the detailed message from the client
      } else if (errorMessage.includes('OPENAI_API_KEY') || errorMessage.includes('API key')) {
        userMessage = `${errorMessage}\n\nPlease check:\n1. OpenAI API key is configured in Vercel environment variables\n2. The key is correct and has not expired`
      } else {
        userMessage = `${errorMessage}\n\nPlease check:\n1. Your browser console for more details\n2. OpenAI API key is configured in Vercel\n3. Your microphone permissions are granted`
      }
      
      alert(userMessage)
      cheatDetectionService.stop()
      stopMedia()
      liveClientRef.current?.disconnect()
      liveClientRef.current = null
      setIsSessionActive(false)
      return
    }
  }

  const endSession = async () => {
    stopMedia()
    cheatDetectionService.stop()
    
    if (liveClientRef.current) {
      liveClientRef.current.disconnect()
      liveClientRef.current = null
    }
    
    // Clear timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
    
    const finalScore = cheatDetectionService.getIntegrityScore()
    console.log('Session ended. Integrity score:', finalScore)
    console.log('Cheat events:', cheatEvents)
    
    setIsSessionActive(false)
    setInterviewDuration(null)
    interviewStartTimeRef.current = null
    setTimeRemaining(null)
    
    // Generate feedback if we have messages
    if (messages.length > 0 && jobUrl.trim()) {
      setIsGeneratingFeedback(true)
      try {
        const conversationHistory = messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        }))
        const feedbackData = await generateInterviewFeedback(conversationHistory, jobUrl)
        setFeedback(feedbackData)
        setShowFeedback(true)
      } catch (error) {
        console.error('Failed to generate feedback:', error)
        // Still show feedback modal with error message
        setFeedback({
          score: 0,
          overallFeedback: 'Unable to generate feedback. Please try again.',
          strengths: [],
          improvements: [],
          studyRecommendations: [],
          specificExamples: [],
        })
        setShowFeedback(true)
      } finally {
        setIsGeneratingFeedback(false)
      }
    }
    
    // Don't clear messages yet - keep them for feedback display
    setCheatEvents([])
    // Reset client to allow re-init with new job desc if needed
    liveClientRef.current = null 
  }
  
  const closeFeedback = () => {
    setShowFeedback(false)
    setFeedback(null)
    setMessages([])
  }

  // Fetch credits function - try API route first, fallback to server action
  const fetchCredits = useCallback(async () => {
    if (!userId) {
      console.warn('No userId provided, cannot fetch credits')
      setCredits(0)
      return
    }
    
    setIsLoadingCredits(true)
    try {
      console.log('Fetching credits for userId:', userId)
      
      // Try API route first (better error messages)
      try {
        const response = await fetch('/api/credits', {
          cache: 'no-store', // Prevent caching
        })
        if (response.ok) {
          const data = await response.json()
          console.log('Credits from API:', data.credits, 'Full response:', data)
          if (typeof data.credits === 'number') {
            console.log('Setting credits state to:', data.credits)
            setCredits(data.credits)
            console.log('Credits state should now be:', data.credits)
            setIsLoadingCredits(false)
            return
          } else {
            console.error('Invalid credits value from API:', data.credits, typeof data.credits)
          }
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          console.error('API error:', response.status, errorData)
        }
      } catch (apiError) {
        console.warn('API route failed, trying server action:', apiError)
      }
      
      // Fallback to server action
      const creditInfo = await getCreditInfo(userId)
      console.log('Credits fetched from server action:', creditInfo.credits)
      setCredits(creditInfo.credits)
    } catch (error) {
      console.error('Failed to fetch credits:', error)
      // Set to 0 on error so UI still shows something
      setCredits(0)
      alert('Failed to fetch credits. Please check the console for details.')
    } finally {
      setIsLoadingCredits(false)
    }
  }, [userId])

  // Fetch credits on mount
  useEffect(() => {
    fetchCredits()
  }, [fetchCredits])

  // Timer for interview duration
  useEffect(() => {
    if (isSessionActive && interviewDuration && interviewStartTimeRef.current) {
      const durationMs = interviewDuration === '10min' ? 10 * 60 * 1000 : 25 * 60 * 1000
      
      timerIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - interviewStartTimeRef.current!
        const remaining = Math.max(0, durationMs - elapsed)
        setTimeRemaining(Math.floor(remaining / 1000))
        
        if (remaining <= 0) {
          // Time's up - end the interview
          endSession()
        }
      }, 1000)
      
      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current)
        }
      }
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
      setTimeRemaining(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSessionActive, interviewDuration])

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
              Paste the job application link to tailor the AI interview.
            </p>
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-neutral-800 px-4 py-2">
              <Star className="h-5 w-5 text-yellow-400 fill-current flex-shrink-0" />
              <span className="text-white font-medium flex-shrink-0">
                {isLoadingCredits ? 'Loading...' : credits !== null ? `${credits.toLocaleString()} Credits` : 'Loading...'}
              </span>
              {credits !== null && !isLoadingCredits && (
                <span className="text-neutral-400 text-sm flex-shrink-0">
                  ({credits >= CREDIT_COSTS['25min'] ? '25 min' : credits >= CREDIT_COSTS['10min'] ? '10 min' : 'Insufficient'} interview available)
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('Refresh button clicked, current credits:', credits)
                  fetchCredits()
                }}
                disabled={isLoadingCredits}
                className="ml-auto text-xs h-6 px-2 disabled:opacity-50 flex-shrink-0"
                title="Refresh credits"
              >
                {isLoadingCredits ? <Loader2 className="h-3 w-3 animate-spin" /> : '↻'}
              </Button>
            </div>
          </div>

          <div className="space-y-4 rounded-lg border border-neutral-800 bg-neutral-900 p-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-200">Job Application Link</label>
              <Input 
                placeholder="https://linkedin.com/jobs/view/... or https://company.com/careers/..."
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white"
              />
              <p className="text-xs text-neutral-500">
                Paste the link to the job posting (LinkedIn, company website, etc.)
              </p>
            </div>

            <Button 
              size="lg" 
              onClick={startSession}
              disabled={!jobUrl.trim()}
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
            {timeRemaining !== null && interviewDuration && (
              <div className="flex items-center gap-2 rounded-full px-4 py-2 bg-blue-500/80 text-white backdrop-blur">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')} remaining
                </span>
              </div>
            )}
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
      
      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-neutral-900 border-neutral-800">
            <CardHeader className="flex flex-row items-center justify-between border-b border-neutral-800">
              <CardTitle className="text-2xl text-white">Interview Feedback</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeFeedback}
                className="text-neutral-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {isGeneratingFeedback ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-white mb-4" />
                  <p className="text-neutral-400">Generating your feedback...</p>
                </div>
              ) : feedback ? (
                <>
                  {/* Score Section */}
                  <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-800/50 p-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Overall Score</h3>
                      <p className="text-sm text-neutral-400">{feedback.overallFeedback}</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="text-5xl font-bold text-white mb-1">{feedback.score}</div>
                      <div className="flex items-center gap-1 text-yellow-400">
                        <Star className="h-5 w-5 fill-current" />
                        <span className="text-sm">/ 100</span>
                      </div>
                    </div>
                  </div>

                  {/* Strengths */}
                  {feedback.strengths.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-400" />
                        <h3 className="text-lg font-semibold text-white">Strengths</h3>
                      </div>
                      <ul className="space-y-2">
                        {feedback.strengths.map((strength, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-neutral-300">
                            <span className="text-green-400 mt-1">•</span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Areas for Improvement */}
                  {feedback.improvements.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-amber-400" />
                        <h3 className="text-lg font-semibold text-white">Areas for Improvement</h3>
                      </div>
                      <ul className="space-y-2">
                        {feedback.improvements.map((improvement, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-neutral-300">
                            <span className="text-amber-400 mt-1">•</span>
                            <span>{improvement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Study Recommendations */}
                  {feedback.studyRecommendations.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-blue-400" />
                        <h3 className="text-lg font-semibold text-white">Study Recommendations</h3>
                      </div>
                      <ul className="space-y-2">
                        {feedback.studyRecommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-neutral-300">
                            <span className="text-blue-400 mt-1">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Specific Examples */}
                  {feedback.specificExamples.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-purple-400" />
                        <h3 className="text-lg font-semibold text-white">Specific Examples from Interview</h3>
                      </div>
                      <ul className="space-y-2">
                        {feedback.specificExamples.map((example, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-neutral-300">
                            <span className="text-purple-400 mt-1">•</span>
                            <span className="italic">{example}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pt-4 border-t border-neutral-800">
                    <Button
                      onClick={closeFeedback}
                      className="w-full bg-white text-black hover:bg-neutral-200"
                    >
                      Close
                    </Button>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
