import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { NavBar } from '@/components/NavBar'
import { createClient } from '@/lib/supabase/server'

const inter = Inter({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Preppo | AI-Powered Interview Practice Platform',
  description: 'Practice job interviews with AI-powered feedback. Get personalized coaching, improve your answers, and build confidence before your real interviews.',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: '/icon.svg',
  },
}

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic'

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Root layout component
  let user = null
  let fullName: string | null = null
  
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    
    if (authUser) {
      user = authUser
      // Fetch profile to get full_name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', authUser.id)
        .single()
      
      fullName = profile?.full_name || null
    }
  } catch (error) {
    // Silently fail - user will be null and NavBar will handle it
    console.error('Error getting user in layout:', error)
  }

  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <NavBar 
          user={user ? { email: user.email || '', id: user.id, fullName } : null} 
          isSubscribed={false} // TODO: Connect to real subscription status
        />
        {children}
      </body>
    </html>
  )
}
