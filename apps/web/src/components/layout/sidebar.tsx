'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, BarChart2, Target, Library, CreditCard, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SubscriptionTier } from '@readrise/types'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart2 },
  { href: '/library', label: 'Library', icon: Library },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/billing', label: 'Billing', icon: CreditCard },
]

interface SidebarProps {
  subscriptionTier?: SubscriptionTier
  currentStreak?: number
}

export function Sidebar({ subscriptionTier = 'free', currentStreak = 0 }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-16 shrink-0 flex-col items-center bg-[#1a1a2e] py-4">
      {/* Logo */}
      <Link
        href="/dashboard"
        className="mb-6 flex h-9 w-9 items-center justify-center rounded-lg text-white/80 transition-colors hover:text-white"
        title="ReadRise"
      >
        <BookOpen className="h-5 w-5" />
      </Link>

      {/* Nav */}
      <nav className="flex flex-1 flex-col items-center gap-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <div key={href} className="group relative">
              <Link
                href={href}
                className={cn(
                  'relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:bg-white/5 hover:text-white/80',
                )}
              >
                {isActive && (
                  <span className="absolute left-0 h-5 w-0.5 rounded-r-full bg-[#e8923a]" />
                )}
                <Icon className="h-5 w-5" />
                {href === '/billing' && subscriptionTier === 'free' && (
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#e8923a]" />
                )}
              </Link>
              {/* Tooltip */}
              <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md bg-[#1a1a2e] px-2 py-1 text-xs font-medium text-white/90 opacity-0 shadow-lg ring-1 ring-white/10 transition-opacity group-hover:opacity-100">
                {label}
                {href === '/billing' && subscriptionTier === 'free' && (
                  <span className="ml-1.5 text-[#e8923a]">↑ Upgrade</span>
                )}
              </span>
            </div>
          )
        })}
      </nav>

      {/* Streak counter */}
      <div className="group relative mb-2 flex flex-col items-center gap-0.5">
        <Flame className={cn('h-5 w-5', currentStreak > 0 ? 'text-[#e8923a]' : 'text-white/20')} />
        <span className={cn('text-[11px] font-semibold tabular-nums', currentStreak > 0 ? 'text-[#e8923a]' : 'text-white/20')}>
          {currentStreak}
        </span>
        <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#1a1a2e] px-2 py-1 text-xs font-medium text-white/90 opacity-0 shadow-lg ring-1 ring-white/10 transition-opacity group-hover:opacity-100">
          {currentStreak > 0 ? `${currentStreak}-day streak` : 'No streak yet — start reading!'}
        </span>
      </div>
    </aside>
  )
}
