import { NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params
  
  return NextResponse.json({
    id,
    status: 'active',
    message: 'Stub response - OpenAI Realtime integration available via /api/realtime/session',
  })
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const { id } = await params
  
  return NextResponse.json({
    id,
    status: 'ended',
    message: 'Session ended successfully',
  })
}

