import type { Metadata } from 'next'
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { NavBar } from '@/components/NavBar'
import { createClient } from '@/lib/supabase/server'

const spaceGrotesk = Space_Grotesk({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'ClearView Interview | AI-Powered Interview Platform',
  description: 'Conduct seamless interviews with AI-powered insights, cheat detection, and Google Meet integration.',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <NavBar user={user ? { email: user.email || '', id: user.id } : null} />
        {children}
      </body>
    </html>
  )
}
