'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ReviewFormProps {
  userBookId: string
  initialRating?: number | null
  initialBody?: string | null
}

export function ReviewForm({ userBookId, initialRating, initialBody }: ReviewFormProps) {
  const [rating, setRating] = useState(initialRating ?? 0)
  const [hovered, setHovered] = useState(0)
  const [body, setBody] = useState(initialBody ?? '')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rating) { toast.error('Please select a rating'); return }
    startTransition(async () => {
      const res = await fetch(`/api/library/${userBookId}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, body: body || undefined }),
      })
      if (res.ok) {
        toast.success('Review saved')
        router.refresh()
      } else {
        toast.error('Failed to save review')
      }
    })
  }

  const display = hovered || rating

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label>Rating</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="text-2xl transition-transform hover:scale-110 focus:outline-none"
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(star)}
              aria-label={`${star} star`}
            >
              <span className={star <= display ? 'text-yellow-400' : 'text-muted-foreground/30'}>
                ★
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="body">Notes (optional)</Label>
        <Textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What did you think?"
          rows={3}
          maxLength={5000}
        />
      </div>
      <Button type="submit" size="sm" disabled={isPending || !rating}>
        Save review
      </Button>
    </form>
  )
}
