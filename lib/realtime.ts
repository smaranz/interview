/**
 * OpenAI Realtime Integration
 * 
 * This module provides stub functions for OpenAI Realtime AI integration.
 * The actual realtime functionality is implemented in lib/openai-realtime.ts
 * 
 * OpenAI API Key: Available via process.env.OPENAI_API_KEY
 * API Documentation: https://platform.openai.com/docs/guides/realtime
 */

export interface AIMessage {
  id: string
  role: 'assistant' | 'user'
  content: string
  timestamp: Date
}

export interface RealtimeSession {
  id: string
  isActive: boolean
  messages: AIMessage[]
}

const mockQuestions = [
  "Tell me about yourself and your background.",
  "What interests you about this role?",
  "Describe a challenging project you've worked on.",
  "How do you handle tight deadlines?",
  "Where do you see yourself in five years?",
  "What's your greatest strength?",
  "Tell me about a time you had to learn something quickly.",
  "How do you approach problem-solving?",
]

let questionIndex = 0

export function createMockSession(): RealtimeSession {
  return {
    id: `session-${Date.now()}`,
    isActive: true,
    messages: [
      {
        id: '1',
        role: 'assistant',
        content: "Welcome to your practice interview. I'll be asking you a series of questions. Take your time to think before answering. Ready to begin?",
        timestamp: new Date(),
      },
    ],
  }
}

export function getNextMockQuestion(): AIMessage {
  const question = mockQuestions[questionIndex % mockQuestions.length]
  questionIndex++
  
  return {
    id: `msg-${Date.now()}`,
    role: 'assistant',
    content: question,
    timestamp: new Date(),
  }
}

export function getMockFeedback(userResponse: string): AIMessage {
  const feedbackOptions = [
    "That's a thoughtful response. Can you elaborate on the specific outcomes?",
    "Good answer. Let's move on to the next question.",
    "Interesting perspective. How did that experience shape your approach?",
    "Thank you for sharing. Let me ask you something else.",
  ]
  
  const feedback = feedbackOptions[Math.floor(Math.random() * feedbackOptions.length)]
  
  return {
    id: `msg-${Date.now()}`,
    role: 'assistant',
    content: userResponse.length > 50 ? feedback : "Could you provide more detail in your response?",
    timestamp: new Date(),
  }
}

export async function initializeRealtimeSession(): Promise<RealtimeSession> {
  return createMockSession()
}

export async function sendAudioToRealtime(_audioBlob: Blob): Promise<AIMessage | null> {
  return null
}

export async function endRealtimeSession(_sessionId: string): Promise<void> {
  questionIndex = 0
}

