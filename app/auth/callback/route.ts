import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  if (error) {
    return NextResponse.redirect(
      `${origin}/auth/signin?error=${encodeURIComponent(errorDescription || error)}`
    )
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/auth/signin?error=${encodeURIComponent('No authorization code provided')}`
    )
  }

  const supabase = await createClient()
  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
  
  if (exchangeError || !data.user) {
    return NextResponse.redirect(
      `${origin}/auth/signin?error=${encodeURIComponent(exchangeError?.message || 'Could not authenticate')}`
    )
  }

  const user = data.user
  
  // Create or update profile for Google SSO users
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('id', user.id)
    .single()

  // Extract user info from Google OAuth metadata
  const fullName = user.user_metadata?.full_name || 
                   user.user_metadata?.name || 
                   `${user.user_metadata?.given_name || ''} ${user.user_metadata?.family_name || ''}`.trim() ||
                   null
  
  const avatarUrl = user.user_metadata?.avatar_url || 
                    user.user_metadata?.picture || 
                    null

  if (!existingProfile) {
    // Create new profile
    const { error: insertError } = await supabase.from('profiles').insert({
      id: user.id,
      email: user.email || '',
      full_name: fullName,
      avatar_url: avatarUrl,
    })

    if (insertError) {
      console.error('Error creating profile:', insertError)
    }
  } else {
    // Update profile if Google provides newer info
    const updates: {
      full_name?: string | null
      avatar_url?: string | null
    } = {}
    
    if (fullName && fullName !== existingProfile.full_name) {
      updates.full_name = fullName
    }

    if (avatarUrl && avatarUrl !== existingProfile.avatar_url) {
      updates.avatar_url = avatarUrl
    }

    if (Object.keys(updates).length > 0) {
      await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}
