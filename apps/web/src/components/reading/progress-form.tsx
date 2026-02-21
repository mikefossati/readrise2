'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ProgressFormProps {
  userBookId: string
  pageCount: number | null
  currentPage: number | null
}

export function ProgressForm({ userBookId, pageCount, currentPage }: ProgressFormProps) {
  const [page, setPage] = useState(currentPage ?? 0)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const percent = pageCount && page ? Math.min(Math.round((page / pageCount) * 100), 100) : 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const res = await fetch(`/api/library/${userBookId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page, pageCount: pageCount ?? undefined }),
      })
      if (res.ok) {
        toast.success('Progress saved')
        router.refresh()
      } else {
        toast.error('Failed to save progress')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="page">Current page {pageCount ? `(of ${pageCount})` : ''}</Label>
        <div className="flex items-center gap-2">
          <Input
            id="page"
            type="number"
            min={0}
            max={pageCount ?? undefined}
            value={page}
            onChange={(e) => setPage(parseInt(e.target.value) || 0)}
            className="w-28"
          />
          <Button type="submit" size="sm" disabled={isPending}>
            Save
          </Button>
        </div>
      </div>
      {pageCount && (
        <div className="space-y-1">
          <Progress value={percent} className="h-2" />
          <p className="text-xs text-muted-foreground">{percent}% complete</p>
        </div>
      )}
    </form>
  )
}
