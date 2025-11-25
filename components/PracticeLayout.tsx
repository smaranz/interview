'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { cheatDetectionService, type CheatEvent, type CheatMetrics } from '@/lib/cheat-detection'

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
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [userInput, setUserInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<{ role: string; content: string }[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Cheat detection state (hidden from user but tracked)
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
        audio: true,
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      console.error('Failed to access media devices:', error)
    }
  }, [])

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
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setAudioEnabled(audioTrack.enabled)
      }
    }
  }

  const startSession = async () => {
    await startMedia()
    setIsSessionActive(true)
    setIsLoading(true)
    
    // Start cheat detection (runs in background, not shown to user)
    cheatDetectionService.start(
      (metrics) => setCheatMetrics(metrics),
      (event) => {
        setCheatEvents(prev => [...prev, event])
        console.log('Cheat event detected:', event) // Log for backend/analytics
      }
    )

    try {
      const response = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStart: true }),
      })
      
      const data = await response.json()
      
      if (data.response) {
        const welcomeMessage: AIMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
        }
        setMessages([welcomeMessage])
        setConversationHistory([{ role: 'model', content: data.response }])
      }
    } catch (error) {
      console.error('Failed to start interview:', error)
      const fallbackMessage: AIMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: "Hello! I'm your AI interviewer today. Let's start with a classic question: Tell me about yourself and what brings you here today.",
        timestamp: new Date(),
      }
      setMessages([fallbackMessage])
      setConversationHistory([{ role: 'model', content: fallbackMessage.content }])
    } finally {
      setIsLoading(false)
    }
  }

  const endSession = () => {
    stopMedia()
    cheatDetectionService.stop()
    
    // Log final integrity data (would be sent to backend in production)
    const finalScore = cheatDetectionService.getIntegrityScore()
    console.log('Session ended. Integrity score:', finalScore)
    console.log('Cheat events:', cheatEvents)
    
    setIsSessionActive(false)
    setMessages([])
    setConversationHistory([])
    setCheatEvents([])
  }

  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return

    const userMessage: AIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userInput,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = userInput
    setUserInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationHistory,
          userMessage: currentInput,
        }),
      })

      const data = await response.json()

      if (data.response) {
        const aiMessage: AIMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, aiMessage])
        setConversationHistory((prev) => [
          ...prev,
          { role: 'user', content: currentInput },
          { role: 'model', content: data.response },
        ])
      }
    } catch (error) {
      console.error('Failed to get AI response:', error)
      const errorMessage: AIMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: "I apologize, but I'm having trouble responding right now. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    return () => {
      stopMedia()
      cheatDetectionService.stop()
    }
  }, [stopMedia])

  if (!isSessionActive) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-800">
            <Video className="h-8 w-8 text-neutral-200" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-white">
            Ready to Practice?
          </h2>
          <p className="max-w-md text-neutral-400">
            Start a mock interview session with our AI interviewer powered by Gemini. You&apos;ll need to allow camera and microphone access.
          </p>
        </div>
        <Button 
          size="lg" 
          onClick={startSession}
          className="bg-white text-black hover:bg-neutral-200"
        >
          Start Practice Session
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] gap-6">
      {/* Video Section - Takes up more space */}
      <div className="flex flex-1 flex-col">
        <div 
          ref={videoContainerRef}
          className="relative flex-1 overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900"
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
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

          {/* Controls overlay */}
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleAudio}
              className={cn(
                'h-12 w-12 rounded-full',
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

      {/* Chat Section */}
      <div className="flex w-96 flex-col rounded-lg border border-neutral-800 bg-neutral-900">
        <div className="flex items-center gap-2 border-b border-neutral-800 p-4">
          <MessageSquare className="h-5 w-5 text-neutral-400" />
          <span className="font-medium text-white">AI Interviewer</span>
          {isLoading && <Loader2 className="ml-auto h-4 w-4 animate-spin text-neutral-400" />}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-lg px-4 py-2.5',
                  message.role === 'user'
                    ? 'bg-white text-black'
                    : 'bg-neutral-800 text-neutral-100'
                )}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && messages.length > 0 && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-lg bg-neutral-800 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-neutral-400" style={{ animationDelay: '0ms' }} />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-neutral-400" style={{ animationDelay: '150ms' }} />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-neutral-400" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-neutral-800 p-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder="Type your response..."
              disabled={isLoading}
              className="flex-1 rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-600 disabled:opacity-50"
            />
            <Button 
              size="icon" 
              onClick={handleSendMessage} 
              disabled={isLoading || !userInput.trim()}
              className="bg-white text-black hover:bg-neutral-200 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
