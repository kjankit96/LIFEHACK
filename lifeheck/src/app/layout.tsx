import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: 'LifeHeck — Daily Routine & Habit Tracker',
  description: 'Track your daily routines, habits, and goals',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="h-full flex flex-col bg-[#0f0f11] text-[#f0f0f5] antialiased">
        <Navigation />
        <main className="flex-1 overflow-hidden">{children}</main>
      </body>
    </html>
  )
}
