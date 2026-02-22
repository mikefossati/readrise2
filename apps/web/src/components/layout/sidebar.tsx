'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, BarChart2, Target, Library, CreditCard, Zap } from 'lucide-react'
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
}

export function Sidebar({ subscriptionTier = 'free' }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-56 flex-col border-r bg-card px-3 py-4">
      <Link href="/dashboard" className="mb-6 flex items-center gap-2 px-2">
        <BookOpen className="h-5 w-5" />
        <span className="font-semibold tracking-tight">ReadRise</span>
      </Link>
      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
              pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
            {href === '/billing' && subscriptionTier === 'free' && (
              <span className="ml-auto flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                <Zap className="h-2.5 w-2.5" />
                Upgrade
              </span>
            )}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
