'use client'

import { createBrowserClient } from '@supabase/ssr'
import { getAuthInstance } from '@/lib/firebase'

/**
 * Creates a Supabase client for use in browser/client components.
 * 
 * This client is configured to use Firebase Auth tokens as a third-party
 * authentication provider. The accessToken function fetches the current
 * Firebase user's ID token for each Supabase request.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      accessToken: async () => {
        // Get the Firebase ID token for the current user
        const auth = getAuthInstance()
        const user = auth?.currentUser
        if (!user) return null
        
        try {
          // Get the token without forcing refresh (for performance)
          // Tokens are automatically refreshed when they expire
          const token = await user.getIdToken(false)
          return token
        } catch (error) {
          console.error('Error getting Firebase ID token for Supabase:', error)
          return null
        }
      },
    }
  )
}
