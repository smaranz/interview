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

    // Dynamically import Firebase to avoid build-time errors
    Promise.all([
      import('firebase/auth'),
      import('@/lib/firebase')
    ]).then(([{ onAuthStateChanged }, { auth }]) => {
      if (!auth) {
        setLoading(false)
        return
      }

      const unsubscribe = onAuthStateChanged(auth, (firebaseUser: any) => {
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
        setLoading(false)
      })

      return () => unsubscribe()
    }).catch((error) => {
      console.error('Firebase auth setup error:', error)
      setLoading(false)
    })
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

