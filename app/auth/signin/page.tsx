'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Video, Chrome } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { signInWithGoogle } from '@/lib/auth/google'
import { onAuthStateChanged } from 'firebase/auth'
import { getAuthInstance } from '@/lib/firebase'

export default function SignInPage() {
  const router = useRouter()
  const supabase = createClient()
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Listen for auth state changes
  useEffect(() => {
    const auth = getAuthInstance()
    if (!auth) {
      setError('Firebase is not initialized. Please check your environment variables.')
      return
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in via Firebase, ensure profile exists in Supabase
        await ensureProfileExists(firebaseUser)
        router.push('/dashboard')
        router.refresh()
      }
    })

    return () => unsubscribe()
  }, [router])

  // Ensure the Firebase user has a profile in Supabase
  const ensureProfileExists = async (firebaseUser: { uid: string; email: string | null; displayName: string | null; photoURL: string | null }) => {
    try {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', firebaseUser.uid)
        .single()

      if (!existingProfile) {
        // Create profile for new user
        await supabase.from('profiles').insert({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          full_name: firebaseUser.displayName || '',
          avatar_url: firebaseUser.photoURL || '',
          credits: 3, // Starting credits for new users
        })
      }
    } catch (error) {
      console.error('Error ensuring profile exists:', error)
    }
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setError(null)
    
    try {
      const result = await signInWithGoogle()
      
      // Ensure profile exists for this user
      await ensureProfileExists(result.user)
      
      // Navigate to dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      console.error('Google sign-in error:', err)
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-foreground">
            <Video className="h-6 w-6 text-background" />
          </div>
          <h1 className="text-2xl font-bold">
            Welcome back
          </h1>
          <p className="mt-2 text-muted-foreground">
            Sign in to your Preppo account
          </p>
        </div>

        <Card>
          <CardHeader className="sr-only">
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Sign in with your Google account</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {error && (
              <p className="mb-4 text-sm text-destructive text-center">{error}</p>
            )}

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
            >
              <Chrome className="mr-2 h-4 w-4" />
              {googleLoading ? 'Connecting...' : 'Continue with Google'}
            </Button>

            <p className="mt-4 text-xs text-center text-muted-foreground">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="font-medium text-foreground hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
