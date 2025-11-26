import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', details: authError?.message },
        { status: 401 }
      )
    }
    
    // Fetch credits
    const { data, error } = await supabase
      .from('profiles')
      .select('credits, email')
      .eq('id', user.id)
      .single()
    
    if (error) {
      console.error('Database error:', error)
      
      // If profile doesn't exist, create it
      if (error.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            credits: 0,
          })
        
        if (insertError) {
          return NextResponse.json(
            { error: 'Failed to create profile', details: insertError.message },
            { status: 500 }
          )
        }
        
        return NextResponse.json({ credits: 0, email: user.email })
      }
      
      return NextResponse.json(
        { error: 'Database error', details: error.message, code: error.code },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      credits: data?.credits ?? 0,
      email: data?.email,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

