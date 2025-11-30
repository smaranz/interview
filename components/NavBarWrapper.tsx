'use client'

import { NavBar } from '@/components/NavBar'
import { useAuth } from '@/components/AuthProvider'

interface NavBarWrapperProps {
  isSubscribed?: boolean
}

export function NavBarWrapper({ isSubscribed = false }: NavBarWrapperProps) {
  const { user, loading } = useAuth()

  // Don't render anything while loading to prevent hydration mismatch
  if (loading) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative flex items-center justify-between rounded-full px-6 h-14 bg-black/40 border border-white/10 backdrop-blur-xl">
            {/* Skeleton loader */}
          </div>
        </div>
      </nav>
    )
  }

  return (
    <NavBar
      user={user ? { 
        email: user.email || '', 
        id: user.uid, 
        fullName: user.displayName 
      } : null}
      isSubscribed={isSubscribed}
    />
  )
}

