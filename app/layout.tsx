import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import { NavBarWrapper } from '@/components/NavBarWrapper'

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <NavBarWrapper isSubscribed={false} />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
