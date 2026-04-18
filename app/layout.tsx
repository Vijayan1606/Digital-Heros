import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Digital Heroes - Win Big, Give Back',
  description: 'Digital Heroes is a premium subscription platform combining golf score tracking, charity fundraising, and a monthly draw-based reward engine.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased selection:bg-primary/30 min-h-screen flex flex-col`}>
        <Navbar />
        <main className="flex-1 flex flex-col pt-16">
          {children}
        </main>
      </body>
    </html>
  )
}
