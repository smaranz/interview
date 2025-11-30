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

      const unsubscribe = onAuthStateChanged(auth, (firebaseUser: any) => {
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
        if (timeoutId) clearTimeout(timeoutId)
        setLoading(false)
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

