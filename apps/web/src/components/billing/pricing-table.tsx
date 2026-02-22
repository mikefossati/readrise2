'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { SubscriptionTier } from '@readrise/types'

interface PricingTableProps {
  currentTier?: SubscriptionTier
  onUpgrade?: (priceId: string) => void
  loading?: boolean
}

const TIERS = [
  {
    id: 'free' as SubscriptionTier,
    name: 'Free',
    monthly: 0,
    annual: 0,
    monthlyPriceId: null as string | null,
    annualPriceId: null as string | null,
    description: 'Get started with reading tracking.',
    features: ['Up to 50 books', 'Basic stats', 'Goodreads import', 'Session timer'],
  },
  {
    id: 'reader' as SubscriptionTier,
    name: 'Reader',
    monthly: 4,
    annual: 38,
    monthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_READER_MONTHLY ?? null,
    annualPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_READER_ANNUAL ?? null,
    description: 'For serious readers who want the full picture.',
    features: ['Unlimited books', 'Full stats & trends', 'All goal types', 'Priority support'],
    highlighted: true,
  },
  {
    id: 'bibliophile' as SubscriptionTier,
    name: 'Bibliophile',
    monthly: 8,
    annual: 77,
    monthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BIBLIOPHILE_MONTHLY ?? null,
    annualPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BIBLIOPHILE_ANNUAL ?? null,
    description: 'Everything, for the most devoted readers.',
    features: ['Everything in Reader', 'Year-in-Review card', 'Social profile (coming soon)', 'Priority support'],
  },
]

export function PricingTable({ currentTier = 'free', onUpgrade, loading }: PricingTableProps) {
  const [interval, setInterval] = useState<'monthly' | 'annual'>('monthly')

  return (
    <div className="space-y-6">
      {/* Interval toggle */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setInterval('monthly')}
          className={cn(
            'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
            interval === 'monthly'
              ? 'bg-foreground text-background'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          Monthly
        </button>
        <button
          onClick={() => setInterval('annual')}
          className={cn(
            'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
            interval === 'annual'
              ? 'bg-foreground text-background'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          Annual
          <span className="ml-1.5 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
            Save 20%
          </span>
        </button>
      </div>

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {TIERS.map((tier) => {
          const isCurrent = tier.id === currentTier
          const price = interval === 'monthly' ? tier.monthly : tier.annual
          const priceId =
            interval === 'monthly' ? tier.monthlyPriceId : tier.annualPriceId

          return (
            <Card
              key={tier.id}
              className={cn(
                'flex flex-col',
                tier.highlighted && !isCurrent && 'border-foreground shadow-md',
              )}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
                <div className="mt-2">
                  {price === 0 ? (
                    <span className="text-3xl font-bold">Free</span>
                  ) : (
                    <>
                      <span className="text-3xl font-bold">${price}</span>
                      <span className="text-sm text-muted-foreground">
                        /{interval === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-4">
                <ul className="space-y-2">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <Button variant="outline" disabled className="w-full">
                    Current plan
                  </Button>
                ) : tier.id === 'free' ? (
                  <Button variant="outline" disabled className="w-full">
                    Free
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    disabled={loading || !priceId}
                    onClick={() => priceId && onUpgrade?.(priceId)}
                  >
                    {loading ? 'Loading…' : `Upgrade to ${tier.name}`}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
