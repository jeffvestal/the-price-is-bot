import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'The Price is Bot 🤖 - AI Shopping Challenge',
  description: 'Challenge yourself to build the perfect $100 grocery cart using AI-powered shopping agents powered by Elastic Agent Builder.',
  keywords: 'AI, shopping, challenge, game, Elasticsearch, Agent Builder',
  authors: [{ name: 'Elastic' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#0077CC',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
