'use server'

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

const INTERVIEW_SYSTEM_PROMPT = `You are a professional AI interviewer conducting a practice job interview. Your role is to:

1. Ask thoughtful, relevant interview questions one at a time
2. Listen to the candidate's responses and provide brief, constructive feedback
3. Follow up on interesting points the candidate makes
4. Maintain a professional but friendly tone
5. Keep responses concise (2-3 sentences max for feedback, 1-2 sentences for questions)

Start by introducing yourself briefly and asking the first question. Focus on behavioral and situational questions.

Important: Do NOT use markdown formatting. Speak naturally as if in a real conversation.`

export async function getAIResponse(
  conversationHistory: { role: 'user' | 'assistant'; content: string }[],
  userMessage: string
): Promise<string> {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured')
    }

    const messages = [
      { role: 'system', content: INTERVIEW_SYSTEM_PROMPT },
      ...conversationHistory.map(msg => ({
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
        messages,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI API error:', response.status, error)
      throw new Error('Failed to get AI response')
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || 'I apologize, but I could not generate a response.'
  } catch (error) {
    console.error('OpenAI API error:', error)
    throw new Error('Failed to get AI response')
  }
}

export async function startInterviewSession(): Promise<string> {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured')
    }

    const messages = [
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
        messages,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI API error:', response.status, error)
      return "Hello! I'm your AI interviewer today. Let's start with a classic question: Tell me about yourself and what brings you here today."
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || "Hello! I'm your AI interviewer today. Let's start with a classic question: Tell me about yourself and what brings you here today."
  } catch (error) {
    console.error('OpenAI API error:', error)
    return "Hello! I'm your AI interviewer today. Let's start with a classic question: Tell me about yourself and what brings you here today."
  }
}

