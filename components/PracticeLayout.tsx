'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
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

const LOCAL_CREDIT_COSTS = {
  '10min': 15,
  '25min': 30,
}

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
  const [selectedDuration, setSelectedDuration] = useState<InterviewDuration | null>(null)
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

    if (!selectedDuration) {
      alert('Please select an interview duration.')
      return
    }

    // Fetch job posting content
    let jobPostingContent = ''
    try {
      console.log('Fetching job posting content from:', jobUrl.trim())
      const jobResponse = await fetch(`/api/fetch-job?url=${encodeURIComponent(jobUrl.trim())}`)
      if (jobResponse.ok) {
        const jobData = await jobResponse.json()
        jobPostingContent = jobData.content || ''
        console.log('Job posting content fetched, length:', jobPostingContent.length)
      } else {
        console.warn('Failed to fetch job posting content, will use URL only')
      }
    } catch (error) {
      console.warn('Error fetching job posting:', error)
      // Continue with just the URL if fetching fails
    }

    try {
      // Try API route first (more reliable than server actions)
      const deductResponse = await fetch('/api/credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ duration: selectedDuration }),
      })

      if (deductResponse.ok) {
        const deductData = await deductResponse.json()
        if (deductData.success) {
          setCredits(deductData.remainingCredits)
          setInterviewDuration(selectedDuration)
          interviewStartTimeRef.current = Date.now()
        } else {
          alert(deductData.error || 'Failed to deduct credits. Please try again.')
          return
        }
      } else {
        // API route failed, try server action as fallback
        const errorData = await deductResponse.json().catch(() => ({}))
        console.warn('API route failed, trying server action:', errorData)
        
        if (errorData.error) {
          alert(errorData.error + (errorData.details ? `: ${errorData.details}` : ''))
        }
        
        // Fallback to server action
        const creditInfo = await getCreditInfo(userId)
        setCredits(creditInfo.credits)
        
        const requiredCredits = CREDIT_COSTS[selectedDuration]
        if (creditInfo.credits < requiredCredits) {
          alert(`Insufficient credits. You need at least ${requiredCredits} credits for a ${selectedDuration} interview. You currently have ${creditInfo.credits} credits.`)
          return
        }

        const deductResult = await deductCredits(userId, selectedDuration)
        if (!deductResult.success) {
          alert(deductResult.error || 'Failed to start interview. Please try again.')
          return
        }
        
        setCredits(deductResult.remainingCredits)
        setInterviewDuration(selectedDuration)
        interviewStartTimeRef.current = Date.now()
      }

      // Continue with media and session setup only if credit deduction succeeded
    await startMedia()
    setIsSessionActive(true)
    } catch (error) {
      console.error('Error starting session:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`Failed to start interview: ${errorMessage}. Please try again.`)
      return
    }
    
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

    const systemInstruction = `You are Alex, a professional job interviewer conducting a LIVE JOB INTERVIEW.

CRITICAL - UNDERSTAND THE ROLES:
- YOU (the AI receiving these instructions) are Alex, the INTERVIEWER
- The USER (the person speaking to you) is the CANDIDATE being interviewed
- The USER is NOT Alex - YOU are Alex
- The USER is applying for a job and you are interviewing them

YOUR IDENTITY - THIS IS WHO YOU ARE:
- Your name is Alex
- You are a JOB INTERVIEWER conducting an interview
- You are NOT an assistant, NOT a chatbot, NOT a helper, NOT a general AI
- You ONLY conduct job interviews - that is your ONLY purpose
- When someone says "hi" or greets you, you respond as an interviewer starting an interview

FIRST THING YOU MUST DO WHEN THE INTERVIEW STARTS:
When the candidate first speaks or when you first respond, you MUST say EXACTLY this:
"Hi, I'm Alex. I'll be conducting your interview today. Let's start by having you introduce yourself and tell me a bit about your background."

ABSOLUTE RULES - THESE ARE NON-NEGOTIABLE:
1. NEVER EVER say "How can I help you" or "How can I assist you" - You are an INTERVIEWER, not an assistant
2. NEVER act like a general assistant or chatbot
3. If someone says "hi" or "hello", you respond by introducing yourself as Alex the interviewer
4. You ALWAYS start by introducing yourself: "Hi, I'm Alex. I'll be conducting your interview today."
5. After introducing yourself, you ALWAYS ask the candidate to introduce themselves
6. You ONLY ask interview questions - you do NOT help with tasks
7. You stay in interviewer character 100% of the time - NEVER break character
8. You ask questions, they answer - that's how interviews work

JOB POSTING INFORMATION:
${jobPostingContent ? `Job Posting Content:\n${jobPostingContent}\n\nJob Posting URL: ${jobUrl.trim()}` : `Job Posting URL: ${jobUrl.trim()}\n\nNote: Use this URL to understand the job requirements. Ask questions about the role, responsibilities, required skills, and qualifications.`}

IMPORTANT INSTRUCTIONS ABOUT THE JOB POSTING:
- The candidate is applying for the position described above
- You MUST use the job posting information to ask relevant interview questions
- Ask questions about the specific role, requirements, and responsibilities mentioned
- Tailor ALL your questions to this specific job position
- Ask about relevant experience, skills, and qualifications for THIS role
- Reference specific aspects of the job when asking follow-up questions

YOUR BEHAVIOR:
- You are Alex, the interviewer
- You introduce yourself first
- You ask the candidate to introduce themselves
- You ask interview questions about their experience, skills, and fit for this role
- You listen to their answers and ask follow-up questions
- You maintain professional interview tone
- You do NOT help them with tasks - you INTERVIEW them

START THE INTERVIEW NOW - YOU MUST SPEAK FIRST:
1. The interview starts when you speak - YOU must initiate the conversation
2. Say immediately: "Hi, I'm Alex. I'll be conducting your interview today."
3. Then say: "Let's start by having you introduce yourself and tell me a bit about your background."
4. After they respond, ask your first interview question based on the job posting at: ${jobUrl.trim()}

CRITICAL: The candidate will NOT speak until you have spoken first. You must start the conversation immediately.

Remember: You are Alex the INTERVIEWER. You conduct interviews. You ask questions based on the job posting. You do NOT help people with tasks.

JOB POSTING TO REFERENCE FOR QUESTIONS:
[Job Posting Link](${jobUrl.trim()})

IMPORTANT INSTRUCTION FOR AI:
1. This is the direct link to the job posting.
2. If you can browse the web, please ACCESS this link to read the full job description.
3. If you cannot access the link, ask the candidate specific questions about the role based on the URL title/slug.
4. Base your interview questions on this job posting.`

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
        
        // Save practice session to database
        try {
          const { savePracticeSession } = await import('@/lib/practice-sessions')
          if (interviewDuration) {
            const result = await savePracticeSession(
              userId,
              jobUrl.trim(),
              interviewDuration,
              conversationHistory,
              feedbackData
            )
            if (result.success) {
              console.log('Practice session saved:', result.sessionId)
            } else {
              console.warn('Failed to save practice session:', result.error)
            }
          }
        } catch (saveError) {
          console.error('Error saving practice session:', saveError)
          // Don't block the UI if saving fails
        }
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
        
        // Try to save session even without feedback
        try {
          const { savePracticeSession } = await import('@/lib/practice-sessions')
          if (interviewDuration) {
            const conversationHistory = messages.map(msg => ({
              role: msg.role,
              content: msg.content,
            }))
            await savePracticeSession(
              userId,
              jobUrl.trim(),
              interviewDuration,
              conversationHistory,
              null
            )
          }
        } catch (saveError) {
          console.error('Error saving practice session:', saveError)
        }
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
            setIsLoadingCredits(false)
            
            // Auto-select duration if user has enough credits and nothing is selected
            // Use functional update to avoid dependency issues
            setSelectedDuration((current) => {
              if (current) {
                console.log('Duration already selected:', current)
                return current // Don't change if already selected
              }
              if (data.credits >= 30) {
                console.log('Auto-selecting 25min duration')
                return '25min'
              }
              if (data.credits >= 15) {
                console.log('Auto-selecting 10min duration')
                return '10min'
              }
              console.log('Not enough credits to auto-select duration')
              return null
            })
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
      
      // Auto-select duration if user has enough credits and nothing is selected
      // Use functional update to avoid dependency issues
      setSelectedDuration((current) => {
        if (current) {
          console.log('Duration already selected:', current)
          return current // Don't change if already selected
        }
        if (creditInfo.canStart25Min) {
          console.log('Auto-selecting 25min duration')
          return '25min'
        }
        if (creditInfo.canStart10Min) {
          console.log('Auto-selecting 10min duration')
          return '10min'
        }
        console.log('Not enough credits to auto-select duration')
        return null
      })
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

  // Debug: Log when selectedDuration changes
  useEffect(() => {
    console.log('selectedDuration changed to:', selectedDuration)
  }, [selectedDuration])

  // Debug: Log when credits state changes
  useEffect(() => {
    console.log('Credits state changed to:', credits, 'isLoadingCredits:', isLoadingCredits)
  }, [credits, isLoadingCredits])

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex min-h-[80vh] flex-col items-center justify-center"
      >
        <div className="w-full max-w-2xl space-y-8">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm"
            >
              <Briefcase className="h-12 w-12 text-white" />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-3 text-4xl font-bold text-white"
            >
              Setup Interview Context
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-lg text-white/60"
            >
              Paste the job application link to tailor the AI interview.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-6 flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-6 py-4 backdrop-blur-md" data-testid="credits-badge"
            >
              <Star className="h-5 w-5 text-white fill-current flex-shrink-0" />
              <span className="text-white font-semibold text-base" data-testid="credits-text">
                {isLoadingCredits 
                  ? 'Loading...' 
                  : credits !== null 
                    ? `${credits.toLocaleString()} Credits` 
                    : 'Loading...'}
              </span>
              {credits !== null && !isLoadingCredits && (
                <span className="text-white/50 text-sm" data-testid="credits-info">
                  ({(() => {
                    const cost25 = 30
                    const cost10 = 15
                    const creditsNum = typeof credits === 'number' ? credits : 0
                    if (creditsNum >= cost25) {
                      return '25 min'
                    }
                    if (creditsNum >= cost10) {
                      return '10 min'
                    }
                    return 'Insufficient'
                  })()} interview available)
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  fetchCredits()
                }}
                disabled={isLoadingCredits}
                className="ml-auto text-sm h-8 px-3 disabled:opacity-50 text-white/60 hover:text-white hover:bg-white/10 rounded-full"
                title="Refresh credits"
              >
                {isLoadingCredits ? <Loader2 className="h-4 w-4 animate-spin" /> : '↻'}
              </Button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-8 sm:p-10 backdrop-blur-sm"
          >
            <div className="space-y-3">
              <label className="text-sm font-semibold text-white/80">Job Application Link</label>
              <Input 
                placeholder="https://linkedin.com/jobs/view/... or https://company.com/careers/..."
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                className="bg-black/40 border-white/10 text-white h-12 text-base focus:border-white/20"
              />
              <p className="text-sm text-white/50">
                Paste the link to the job posting (LinkedIn, company website, etc.)
              </p>
            </div>
            
            <div className="space-y-4">
              <label className="text-sm font-semibold text-white/80">Interview Duration</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    const creditsNum = typeof credits === 'number' ? credits : 0
                    if (creditsNum >= 15) {
                      setSelectedDuration('10min')
                    } else {
                      alert(`You need at least 15 credits for a 10-minute interview. You currently have ${creditsNum} credits.`)
                    }
                  }}
                  disabled={credits === null || (typeof credits === 'number' && credits < 15)}
                  className={cn(
                    "relative group flex flex-col items-start p-6 rounded-2xl border transition-all duration-300 h-full",
                    selectedDuration === '10min'
                      ? "border-white bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.1)] scale-[1.02]"
                      : "border-white/10 bg-white/5 text-white hover:border-white/30 hover:bg-white/10",
                    (credits === null || (typeof credits === 'number' && credits < 15)) && "opacity-50 cursor-not-allowed hover:border-white/10 hover:bg-white/5"
                  )}
                >
                  <div className={cn(
                    "mb-4 flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                    selectedDuration === '10min' ? "bg-black/10 text-black" : "bg-white/10 text-white"
                  )}>
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="font-bold text-xl mb-1">10 Minutes</div>
                  <div className={cn(
                    "text-sm mb-4",
                    selectedDuration === '10min' ? "text-black/60" : "text-white/40"
                  )}>
                    Quick practice session
                  </div>
                  <div className={cn(
                    "mt-auto text-xs font-medium px-2 py-1 rounded-full",
                    selectedDuration === '10min' ? "bg-black/10 text-black" : "bg-white/10 text-white/60"
                  )}>
                    15 Credits
                  </div>
                  {/* Checkmark for selected state */}
                  {selectedDuration === '10min' && (
                    <div className="absolute top-4 right-4 h-6 w-6 rounded-full bg-black text-white flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const creditsNum = typeof credits === 'number' ? credits : 0
                    if (creditsNum >= 30) {
                      setSelectedDuration('25min')
                    } else {
                      alert(`You need at least 30 credits for a 25-minute interview. You currently have ${creditsNum} credits.`)
                    }
                  }}
                  disabled={credits === null || (typeof credits === 'number' && credits < 30)}
                  className={cn(
                    "relative group flex flex-col items-start p-6 rounded-2xl border transition-all duration-300 h-full",
                    selectedDuration === '25min'
                      ? "border-white bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.1)] scale-[1.02]"
                      : "border-white/10 bg-white/5 text-white hover:border-white/30 hover:bg-white/10",
                    (credits === null || (typeof credits === 'number' && credits < 30)) && "opacity-50 cursor-not-allowed hover:border-white/10 hover:bg-white/5"
                  )}
                >
                  <div className={cn(
                    "mb-4 flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                    selectedDuration === '25min' ? "bg-black/10 text-black" : "bg-white/10 text-white"
                  )}>
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="font-bold text-xl mb-1">25 Minutes</div>
                  <div className={cn(
                    "text-sm mb-4",
                    selectedDuration === '25min' ? "text-black/60" : "text-white/40"
                  )}>
                    Deep dive interview
                  </div>
                  <div className={cn(
                    "mt-auto text-xs font-medium px-2 py-1 rounded-full",
                    selectedDuration === '25min' ? "bg-black/10 text-black" : "bg-white/10 text-white/60"
                  )}>
                    30 Credits
                  </div>
                  {/* Checkmark for selected state */}
                  {selectedDuration === '25min' && (
                    <div className="absolute top-4 right-4 h-6 w-6 rounded-full bg-black text-white flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  )}
                </button>
              </div>
              {selectedDuration && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10"
                >
                  <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      Selected: {selectedDuration === '10min' ? '10 minutes' : '25 minutes'} session
                    </p>
                    <p className="text-xs text-white/50">
                      Cost: {LOCAL_CREDIT_COSTS[selectedDuration]} credits
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            <Button 
              size="lg" 
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (!jobUrl.trim()) {
                  alert('Please enter a job application link.')
                  return
                }
                if (!selectedDuration) {
                  alert('Please select an interview duration.')
                  return
                }
                startSession()
              }}
              disabled={!jobUrl.trim() || !selectedDuration}
              className="w-full h-14 text-lg font-semibold rounded-full bg-white text-black hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              Start Live Session
            </Button>
            {(!jobUrl.trim() || !selectedDuration) && (
              <p className="text-sm text-white/50 mt-3">
                {!jobUrl.trim() && '⚠️ Please enter a job application link. '}
                {!selectedDuration && '⚠️ Please select an interview duration.'}
              </p>
            )}
          </motion.div>
        </div>
      </motion.div>
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
