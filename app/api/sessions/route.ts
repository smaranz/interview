import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: 'Sessions API endpoint - stub for future realtime features',
    endpoints: {
      'POST /api/sessions': 'Create a new realtime session',
      'GET /api/sessions/:id': 'Get session details',
      'DELETE /api/sessions/:id': 'End a session',
    },
  })
}

export async function POST() {
  return NextResponse.json({
    id: `session-${Date.now()}`,
    status: 'created',
    message: 'Stub response - implement Gemini Realtime integration',
  })
}

