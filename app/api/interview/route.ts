import { NextRequest, NextResponse } from 'next/server'

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

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

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured' },
        { status: 500 }
      )
    }

    if (isStart) {
      const openaiMessages = [
        { role: 'system', content: INTERVIEW_SYSTEM_PROMPT },
        {
          role: 'user',
          content: 'Start the interview. Introduce yourself briefly and ask the first question.',
        },
      ]

      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: openaiMessages,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('OpenAI API error:', response.status, error)
        return NextResponse.json(
          { error: 'Failed to get AI response' },
          { status: 500 }
        )
      }

      const data = await response.json()
      return NextResponse.json({ response: data.choices[0]?.message?.content || '' })
    }

    const openaiMessages = [
      { role: 'system', content: INTERVIEW_SYSTEM_PROMPT },
      ...messages.map((msg: { role: string; content: string }) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: userMessage },
    ]

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: openaiMessages,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI API error:', response.status, error)
      return NextResponse.json(
        { error: 'Failed to get AI response' },
        { status: 500 }
      )
    }

    const data = await response.json()
    return NextResponse.json({ response: data.choices[0]?.message?.content || '' })
  } catch (error) {
    console.error('OpenAI API error:', error)
    return NextResponse.json(
      { error: 'Failed to get AI response' },
      { status: 500 }
    )
  }
}

