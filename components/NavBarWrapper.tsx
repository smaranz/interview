'use client'

import { NavBar } from '@/components/NavBar'
import { useAuth } from '@/components/AuthProvider'

interface NavBarWrapperProps {
  isSubscribed?: boolean
}

export function NavBarWrapper({ isSubscribed = false }: NavBarWrapperProps) {
  const { user, loading } = useAuth()

  // Don't block the navbar - show it even while loading to prevent blank screen
  // The auth state will update when Firebase initializes

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

