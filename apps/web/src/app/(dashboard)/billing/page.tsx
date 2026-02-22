'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PricingTable } from '@/components/billing/pricing-table'
import type { SubscriptionTier, SubscriptionStatus } from '@readrise/types'

interface UserPlan {
  subscriptionTier: SubscriptionTier
  subscriptionStatus: SubscriptionStatus
  stripeCustomerId: string | null
}

const TIER_LABELS: Record<SubscriptionTier, string> = {
  free: 'Free',
  reader: 'Reader',
  bibliophile: 'Bibliophile',
}

const STATUS_LABELS: Record<SubscriptionStatus, { label: string; variant: 'default' | 'destructive' | 'secondary' | 'outline' }> = {
  active: { label: 'Active', variant: 'default' },
  trialing: { label: 'Trial', variant: 'secondary' },
  past_due: { label: 'Payment failed', variant: 'destructive' },
  canceled: { label: 'Canceled', variant: 'outline' },
}

export default function BillingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [plan, setPlan] = useState<UserPlan | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    if (searchParams.get('success') === '1') {
      toast.success('Your plan has been upgraded!')
    }
  }, [searchParams])

  useEffect(() => {
    fetch('/api/user/plan')
      .then((r) => r.json())
      .then(({ data }) => setPlan(data))
      .catch(() => null)
  }, [])

  async function handleUpgrade(priceId: string) {
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })
      const { url } = await res.json()
      if (url) router.push(url)
    } finally {
      setCheckoutLoading(false)
    }
  }

  async function handleManage() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const { url } = await res.json()
      if (url) router.push(url)
    } finally {
      setPortalLoading(false)
    }
  }

  const tier = plan?.subscriptionTier ?? 'free'
  const status = plan?.subscriptionStatus ?? 'active'
  const isPaid = tier !== 'free'

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-sm text-muted-foreground">Manage your plan and subscription.</p>
      </div>

      {/* Current plan card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current plan
          </CardTitle>
          <CardDescription>Your active ReadRise subscription.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xl font-semibold">{TIER_LABELS[tier]}</span>
            {isPaid && (
              <Badge variant={STATUS_LABELS[status].variant}>{STATUS_LABELS[status].label}</Badge>
            )}
          </div>
          {isPaid && (
            <Button variant="outline" onClick={handleManage} disabled={portalLoading}>
              {portalLoading ? 'Loading…' : 'Manage subscription'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Upgrade table — shown for free users or as a reference for paid users */}
      {!isPaid && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Upgrade your plan</h2>
          <PricingTable currentTier={tier} onUpgrade={handleUpgrade} loading={checkoutLoading} />
        </div>
      )}
    </div>
  )
}
