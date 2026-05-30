'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CheckSquare, BarChart2, Settings, Zap } from 'lucide-react'

const NAV = [
  { href: '/dashboard', label: 'Today', icon: CheckSquare },
  { href: '/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/manage', label: 'Manage', icon: Settings },
]

export default function Navigation() {
  const path = usePathname()

  return (
    <header className="border-b border-[#2e2e35] bg-[#1a1a1f]">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <Zap className="w-5 h-5 text-indigo-400" fill="currentColor" />
          <span className="text-white">LifeHeck</span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = path.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-indigo-500/20 text-indigo-300'
                    : 'text-[#8888a0] hover:text-white hover:bg-[#242429]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
