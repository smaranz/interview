import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '')

const INTERVIEW_SYSTEM_PROMPT = `You are a professional AI interviewer conducting a practice job interview. Your role is to:

1. Ask thoughtful, relevant interview questions one at a time
2. Listen to the candidate's responses and provide brief, constructive feedback
3. Follow up on interesting points the candidate makes
4. Maintain a professional but friendly tone
5. Keep responses concise (2-3 sentences max for feedback, 1-2 sentences for questions)

Focus on behavioral and situational questions. Do NOT use markdown formatting. Speak naturally as if in a real conversation.`

export async function POST(request: NextRequest) {
  try {
    const { messages, userMessage, isStart } = await request.json()

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    if (isStart) {
      const chat = model.startChat({
        systemInstruction: INTERVIEW_SYSTEM_PROMPT,
      })

      const result = await chat.sendMessage(
        'Start the interview. Introduce yourself briefly and ask the first question.'
      )
      const response = await result.response
      return NextResponse.json({ response: response.text() })
    }

    const chat = model.startChat({
      history: messages.map((msg: { role: string; content: string }) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })),
      systemInstruction: INTERVIEW_SYSTEM_PROMPT,
    })

    const result = await chat.sendMessage(userMessage)
    const response = await result.response
    return NextResponse.json({ response: response.text() })
  } catch (error) {
    console.error('Gemini API error:', error)
    return NextResponse.json(
      { error: 'Failed to get AI response' },
      { status: 500 }
    )
  }
}

