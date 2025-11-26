import { NextRequest, NextResponse } from 'next/server'

const OPENAI_REALTIME_URL = 'https://api.openai.com/v1/realtime/calls'

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY is not configured.' },
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
      return NextResponse.json(
        { error: 'Failed to initialize OpenAI Realtime session.' },
        { status: 500 }
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
    return NextResponse.json({ error: 'Realtime session initialization failed.' }, { status: 500 })
  }
}


