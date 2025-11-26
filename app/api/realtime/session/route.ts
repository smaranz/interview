import { NextRequest, NextResponse } from 'next/server'

const OPENAI_REALTIME_URL = 'https://api.openai.com/v1/realtime/calls'

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    console.error('OPENAI_API_KEY is not configured in environment variables')
    return NextResponse.json(
      { error: 'OPENAI_API_KEY is not configured. Please add it to your Vercel environment variables.' },
      { status: 500 }
    )
  }

  const sdpOffer = await request.text()

  if (!sdpOffer) {
    return NextResponse.json({ error: 'Missing SDP offer in request body.' }, { status: 400 })
  }

  try {
    const formData = new FormData()
    formData.set('sdp', sdpOffer)
    formData.set(
      'session',
      JSON.stringify({
        type: 'realtime',
        model: 'gpt-realtime-mini',
        audio: {
          output: {
            voice: 'marin',
          },
        },
      })
    )

    const response = await fetch(OPENAI_REALTIME_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    })

    const responseBody = await response.text()

    if (!response.ok) {
      console.error('OpenAI Realtime session error:', response.status, responseBody)
      // Try to parse error message from OpenAI
      let errorMessage = 'Failed to initialize OpenAI Realtime session.'
      try {
        const errorJson = JSON.parse(responseBody)
        errorMessage = errorJson.error?.message || errorJson.error || errorMessage
      } catch {
        // If not JSON, use a more descriptive message
        if (response.status === 401) {
          errorMessage = 'Invalid OpenAI API key. Please check your OPENAI_API_KEY environment variable.'
        } else if (response.status === 429) {
          errorMessage = 'Rate limit exceeded. Please try again later.'
        } else {
          errorMessage = `OpenAI API error (${response.status}): ${responseBody.substring(0, 200)}`
        }
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status || 500 }
      )
    }

    return new NextResponse(responseBody, {
      status: 200,
      headers: {
        'Content-Type': 'application/sdp',
      },
    })
  } catch (error) {
    console.error('Realtime session initialization failed:', error)
    const errorMessage = error instanceof Error ? error.message : 'Realtime session initialization failed.'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}


