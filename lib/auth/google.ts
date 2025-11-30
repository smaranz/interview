'use client'

import { signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'

/**
 * Firebase Google SSO Authentication
 * 
 * Uses Firebase Auth for Google sign-in, which then connects to Supabase
 * as a third-party auth provider.
 */

export interface GoogleAuthResult {
  user: {
    uid: string
    email: string | null
    displayName: string | null
    photoURL: string | null
  }
  token: string | null
}

/**
 * Sign in with Google using Firebase Auth
 */
export async function signInWithGoogle(): Promise<GoogleAuthResult> {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    const user = result.user
    
    // Get the Firebase ID token - this will be used by Supabase
    const token = await user.getIdToken(true) // Force refresh to get latest claims
    
    return {
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      },
      token,
    }
  } catch (error) {
    console.error('Google sign-in error:', error)
    throw error
  }
}

/**
 * Sign out from Firebase
 */
export async function signOutFromGoogle(): Promise<void> {
  try {
    await firebaseSignOut(auth)
  } catch (error) {
    console.error('Sign out error:', error)
    throw error
  }
}

/**
 * Get current Firebase user's ID token
 */
export async function getFirebaseIdToken(): Promise<string | null> {
  const user = auth.currentUser
  if (!user) return null
  
  try {
    return await user.getIdToken(false)
  } catch (error) {
    console.error('Error getting ID token:', error)
    return null
  }
}

/**
 * Check if user is signed in via Firebase
 */
export function isFirebaseUserSignedIn(): boolean {
  return !!auth.currentUser
}
