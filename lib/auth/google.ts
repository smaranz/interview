import { createClient } from '@/lib/supabase/client'

/**
 * Google SSO Authentication Helper
 * 
 * Handles Google OAuth sign-in and sign-up flows
 */

export interface GoogleAuthOptions {
  redirectTo?: string
  scopes?: string[]
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle(options: GoogleAuthOptions = {}) {
  const supabase = createClient()
  const redirectTo = options.redirectTo || `${window.location.origin}/auth/callback`
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
        ...(options.scopes && { scope: options.scopes.join(' ') }),
      },
    },
  })

  if (error) {
    throw new Error(`Google sign-in failed: ${error.message}`)
  }

  return data
}

/**
 * Sign up with Google OAuth (same as sign-in for OAuth providers)
 */
export async function signUpWithGoogle(options: GoogleAuthOptions = {}) {
  return signInWithGoogle(options)
}

/**
 * Check if Google OAuth is configured
 */
export function isGoogleOAuthConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

