'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Video, LayoutDashboard, PlayCircle, LogOut, DollarSign, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface NavBarProps {
  user?: { email: string; id: string } | null
}

export function NavBar({ user }: NavBarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navigation = user
    ? [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Practice', href: '/practice', icon: PlayCircle },
        { name: 'Resume', href: '/resume', icon: FileText },
        { name: 'Pricing', href: '/pricing', icon: DollarSign },
      ]
    : [
        { name: 'Pricing', href: '/pricing', icon: DollarSign },
      ]

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out",
          scrolled ? "py-4" : "py-6"
        )}
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className={cn(
            "flex items-center justify-between rounded-full px-6 transition-all duration-300",
            scrolled 
              ? "bg-black/40 border border-white/10 shadow-lg shadow-purple-900/10 backdrop-blur-md h-14" 
              : "bg-transparent h-16"
          )}>
            <div className="flex items-center gap-8">
              <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2 group">
                <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20 transition-transform group-hover:scale-105">
                  <Video className="h-4 w-4 text-white" />
                  <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/20" />
                </div>
                <span className="text-lg font-bold tracking-tight text-white/90 group-hover:text-white transition-colors">
                  Honest Hire
                </span>
              </Link>
              
              <div className="hidden md:flex md:items-center md:gap-1">
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
            </div>
            
            <div className="hidden md:flex md:items-center md:gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-white/60">
                    {user.email}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleSignOut}
                    className="text-white/70 hover:text-white hover:bg-white/10 rounded-full"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link href="/auth/signin">
                    <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10 rounded-full">Sign in</Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button size="sm" className="bg-white text-black hover:bg-white/90 rounded-full shadow-lg shadow-white/10 transition-transform hover:scale-105">
                      Get Started
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
            className="fixed inset-x-0 top-20 z-40 mx-4 overflow-hidden rounded-2xl border border-white/10 bg-black/60 p-4 backdrop-blur-xl md:hidden"
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
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white"
                  >
                    <LogOut className="h-5 w-5" />
                    Sign out
                  </button>
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
