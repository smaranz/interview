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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <NavBar user={user ? { email: user.email || '', id: user.id } : null} />
        {children}
      </body>
    </html>
  )
}
