'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Video, LayoutDashboard, PlayCircle, LogOut, DollarSign, FileText, ArrowRight, Settings, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { signOutFromGoogle } from '@/lib/auth/google'
import { useRouter } from 'next/navigation'

interface NavBarProps {
  user?: { email: string; id: string; fullName?: string | null } | null
  isSubscribed?: boolean
}

export function NavBar({ user, isSubscribed = false }: NavBarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const [scrolled, setScrolled] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  
  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])
  
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setScrolled(currentScrollY > 20)
      
      // Hide navbar when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const navigation = user
    ? [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Practice', href: '/practice', icon: PlayCircle },
        { name: 'Resume', href: '/resume', icon: FileText },
        // Hide Pricing if subscribed
        ...(isSubscribed ? [] : [{ name: 'Pricing', href: '/pricing', icon: DollarSign }]),
      ]
    : [
        { name: 'Pricing', href: '/pricing', icon: DollarSign },
      ]

  const handleSignOut = async () => {
    setUserMenuOpen(false)
    await signOutFromGoogle()
    router.push('/')
    router.refresh()
  }

  const firstName = user?.fullName?.split(' ')[0] || user?.email?.split('@')[0] || 'User'

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: isVisible ? 0 : -100 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed top-0 left-0 right-0 z-50 py-4 pointer-events-none"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pointer-events-auto">
          <div className={cn(
            "relative flex items-center justify-between rounded-full px-6 h-14 transition-all duration-300",
            // Always apply glass style to match the example
            "bg-black/40 border border-white/10 shadow-lg backdrop-blur-xl supports-[backdrop-filter]:bg-black/20"
          )}>
            <div className="flex items-center gap-8">
              <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2 group">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black transition-transform group-hover:scale-105">
                  <Video className="h-4 w-4" />
                </div>
                <span className="text-lg font-bold tracking-tight text-white transition-colors">
                  Preppo
                </span>
              </Link>
            </div>
              
            <div className="hidden md:absolute md:left-1/2 md:-translate-x-1/2 md:flex md:items-center md:gap-1">
                {navigation.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'relative flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                        isActive
                          ? 'text-white'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="navbar-indicator"
                          className="absolute inset-0 rounded-full bg-white/10"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <Icon className="h-4 w-4" />
                      <span className="relative z-10">{item.name}</span>
                    </Link>
                  )
                })}
            </div>
            
            <div className="hidden md:flex md:items-center md:gap-4">
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button 
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 rounded-full bg-white/5 hover:bg-white/10 px-3 py-1.5 transition-colors border border-white/5 hover:border-white/10"
                  >
                    <div className="h-6 w-6 rounded-full bg-white flex items-center justify-center text-xs font-bold text-black">
                      {firstName.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-white">
                      {firstName}
                    </span>
                    <ChevronDown className={cn("h-3 w-3 text-white/50 transition-transform", userMenuOpen && "rotate-180")} />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-white/10 bg-black/90 p-2 shadow-xl backdrop-blur-xl"
                      >
                        <div className="px-2 py-1.5 mb-2 border-b border-white/10">
                          <p className="text-xs font-medium text-white/40">Signed in as</p>
                          <p className="text-sm font-medium text-white truncate">{user.email}</p>
                        </div>
                        
                        <Link 
                          href="/settings" 
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                        >
                          <Settings className="h-4 w-4" />
                          Settings
                        </Link>
                        
                        <button
                          onClick={handleSignOut}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/auth/signin">
                    <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10 rounded-full h-8">Sign in</Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button size="sm" className="bg-white text-black hover:bg-white/90 rounded-full h-8 px-4 text-xs font-semibold transition-transform hover:scale-105">
                      Get Started
                      <ArrowRight className="ml-1.5 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
            
            <button
              type="button"
              className="md:hidden rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-20 z-40 mx-4 overflow-hidden rounded-2xl border border-white/10 bg-black/90 p-4 backdrop-blur-xl md:hidden"
          >
            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
              
              <div className="mt-4 border-t border-white/10 pt-4">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 px-4 py-2 mb-2">
                       <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-sm font-bold text-black">
                          {firstName.charAt(0)}
                       </div>
                       <div>
                         <p className="text-sm font-medium text-white">{firstName}</p>
                         <p className="text-xs text-white/40 truncate max-w-[150px]">{user.email}</p>
                       </div>
                    </div>
                    <Link
                      href="/settings"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white"
                    >
                      <Settings className="h-5 w-5" />
                      Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10"
                    >
                      <LogOut className="h-5 w-5" />
                      Sign out
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Link href="/auth/signin" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full text-white/70 hover:text-white hover:bg-white/10 rounded-xl">Sign in</Button>
                    </Link>
                    <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full bg-white text-black hover:bg-white/90 rounded-xl">Get Started</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
