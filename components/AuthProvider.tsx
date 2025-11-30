'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
})

export function useAuth() {
  return useContext(AuthContext)
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      setLoading(false)
      return
    }

    let timeoutId: NodeJS.Timeout | null = null
    let isMounted = true

    // Set a timeout to ensure loading always resolves
    timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn('Firebase auth initialization timeout - proceeding without auth')
        setLoading(false)
      }
    }, 5000) // 5 second timeout

    // Dynamically import Firebase to avoid build-time errors
    Promise.all([
      import('firebase/auth'),
      import('@/lib/firebase')
    ]).then(([{ onAuthStateChanged }, { getAuthInstance }]) => {
      if (!isMounted) return

      const auth = getAuthInstance()
      if (!auth) {
        console.warn('Firebase auth instance not available')
        if (timeoutId) clearTimeout(timeoutId)
        setLoading(false)
        return
      }

      console.log('Setting up onAuthStateChanged listener')
      
      // Clear the timeout since we have Firebase now
      if (timeoutId) clearTimeout(timeoutId)

      // Check current user immediately and set loading to false
      const currentUser = auth.currentUser
      if (currentUser) {
        console.log('User already signed in:', currentUser.email)
        setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
        })
        setLoading(false)
      } else {
        console.log('No user currently signed in')
        // Still set loading to false - user can sign in later
        setLoading(false)
      }

      // Set up listener for future auth changes
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser: any) => {
        console.log('Auth state changed:', firebaseUser ? 'signed in' : 'signed out')
        
        if (!isMounted) return

        if (firebaseUser) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          })
        } else {
          setUser(null)
        }
        // Don't set loading here - already set above
      }, (error) => {
        console.error('Auth state changed error:', error)
        if (isMounted && loading) {
          setLoading(false)
        }
      })

      return () => {
        if (unsubscribe) unsubscribe()
      }
    }).catch((error) => {
      console.error('Firebase auth setup error:', error)
      if (timeoutId) clearTimeout(timeoutId)
      if (isMounted) {
        setLoading(false)
      }
    })

    return () => {
      isMounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

