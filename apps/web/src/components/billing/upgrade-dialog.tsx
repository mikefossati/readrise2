'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { PricingTable } from './pricing-table'

interface UpgradeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UpgradeDialog({ open, onOpenChange }: UpgradeDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleUpgrade(priceId: string) {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })
      const { url } = await res.json()
      if (url) router.push(url)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>You&apos;ve reached the free plan limit</DialogTitle>
          <DialogDescription>
            Free accounts can add up to 50 books. Upgrade to Reader or Bibliophile for unlimited books and more.
          </DialogDescription>
        </DialogHeader>
        <PricingTable currentTier="free" onUpgrade={handleUpgrade} loading={loading} />
      </DialogContent>
    </Dialog>
  )
}
