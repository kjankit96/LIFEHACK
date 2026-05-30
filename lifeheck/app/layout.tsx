import type { Metadata } from 'next'
import Navigation from '../components/Navigation'
import './globals.css'

export const metadata: Metadata = {
  title: 'LifeHeck — Daily Habit Tracker',
  description: 'Track your daily habits, routines, and goals',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navigation />
        <main>{children}</main>
      </body>
    </html>
  )
}
