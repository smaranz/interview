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
  title: 'Honest Hire | AI-Powered Interview Platform',
  description: 'Conduct seamless interviews with AI-powered insights and Google Meet integration.',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  let user = null
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    user = authUser
  } catch (error) {
    // Silently fail - user will be null and NavBar will handle it
    console.error('Error getting user in layout:', error)
  }

  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <NavBar user={user ? { email: user.email || '', id: user.id } : null} />
        {children}
      </body>
    </html>
  )
}
