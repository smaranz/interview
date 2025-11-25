'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CheatMonitor } from '@/components/CheatMonitor'
import { cn } from '@/lib/utils'
import { createMockSession, getNextMockQuestion, getMockFeedback, type AIMessage } from '@/lib/realtime'

export function PracticeLayout() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [userInput, setUserInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const startMedia = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
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
    const session = createMockSession()
    setMessages(session.messages)
    setIsSessionActive(true)
    
    setTimeout(() => {
      const firstQuestion = getNextMockQuestion()
      setMessages((prev) => [...prev, firstQuestion])
    }, 3000)
  }

  const endSession = () => {
    stopMedia()
    setIsSessionActive(false)
    setMessages([])
  }

  const handleSendMessage = () => {
    if (!userInput.trim()) return
    
    const userMessage: AIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userInput,
      timestamp: new Date(),
    }
    
    setMessages((prev) => [...prev, userMessage])
    setUserInput('')
    
    setTimeout(() => {
      const feedback = getMockFeedback(userInput)
      setMessages((prev) => [...prev, feedback])
      
      setTimeout(() => {
        const nextQuestion = getNextMockQuestion()
        setMessages((prev) => [...prev, nextQuestion])
      }, 2000)
    }, 1500)
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    return () => {
      stopMedia()
    }
  }, [stopMedia])

  if (!isSessionActive) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
            <Video className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Ready to Practice?
          </h2>
          <p className="max-w-md text-zinc-600 dark:text-zinc-400">
            Start a mock interview session with our AI interviewer. You&apos;ll need to allow camera and microphone access.
          </p>
        </div>
        <Button size="lg" onClick={startSession}>
          Start Practice Session
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="relative aspect-video overflow-hidden rounded-xl bg-zinc-900">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={cn(
              'h-full w-full object-cover',
              !videoEnabled && 'hidden'
            )}
          />
          {!videoEnabled && (
            <div className="flex h-full items-center justify-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-zinc-800">
                <VideoOff className="h-10 w-10 text-zinc-500" />
              </div>
            </div>
          )}
          
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
            <Button
              variant={audioEnabled ? 'secondary' : 'danger'}
              size="sm"
              onClick={toggleAudio}
              className="rounded-full"
            >
              {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>
            <Button
              variant={videoEnabled ? 'secondary' : 'danger'}
              size="sm"
              onClick={toggleVideo}
              className="rounded-full"
            >
              {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={endSession}
              className="rounded-full"
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <CheatMonitor isActive={isSessionActive} />
      </div>
      
      <div className="flex h-[600px] flex-col rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2 border-b border-zinc-200 p-4 dark:border-zinc-800">
          <MessageSquare className="h-5 w-5 text-indigo-600" />
          <span className="font-medium text-zinc-900 dark:text-zinc-100">AI Interviewer</span>
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
                  'max-w-[85%] rounded-2xl px-4 py-2.5',
                  message.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                )}
              >
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your response..."
              className="flex-1 rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500"
            />
            <Button size="sm" onClick={handleSendMessage}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

