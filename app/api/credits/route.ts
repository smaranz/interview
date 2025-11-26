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

// POST handler for deducting credits (alternative to server actions)
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { duration } = body

    if (!duration || (duration !== '10min' && duration !== '25min')) {
      return NextResponse.json(
        { error: 'Invalid duration. Must be "10min" or "25min"' },
        { status: 400 }
      )
    }

    const CREDIT_COSTS: Record<'10min' | '25min', number> = {
      '10min': 15,
      '25min': 30,
    }

    const cost = CREDIT_COSTS[duration as '10min' | '25min']

    // Get current credits
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        // Profile doesn't exist, create it
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

        return NextResponse.json(
          { error: 'Insufficient credits', remainingCredits: 0 },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: 'Database error', details: profileError.message },
        { status: 500 }
      )
    }

    const currentCredits = profileData?.credits ?? 0

    if (currentCredits < cost) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          remainingCredits: currentCredits,
          required: cost,
        },
        { status: 400 }
      )
    }

    // Deduct credits
    const newCredits = currentCredits - cost
    const { data: updatedData, error: updateError } = await supabase
      .from('profiles')
      .update({ credits: newCredits })
      .eq('id', user.id)
      .select('credits')
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to deduct credits', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      remainingCredits: updatedData?.credits ?? newCredits,
    })
  } catch (error) {
    console.error('POST /api/credits error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

