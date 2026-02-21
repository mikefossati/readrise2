'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ChevronDown, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

const SHELF_OPTIONS = [
  { value: 'reading', label: 'Currently Reading' },
  { value: 'want_to_read', label: 'Want to Read' },
  { value: 'finished', label: 'Mark as Finished' },
  { value: 'abandoned', label: 'Mark as Abandoned' },
] as const

export function ShelfActions({
  userBookId,
  currentShelf,
}: {
  userBookId: string
  currentShelf: string
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function moveToShelf(shelf: string) {
    startTransition(async () => {
      const body: Record<string, unknown> = { shelf }
      if (shelf === 'finished') body.finishedAt = new Date().toISOString().split('T')[0]
      if (shelf === 'abandoned') body.abandonedAt = new Date().toISOString().split('T')[0]
      if (shelf === 'reading') body.startedAt = new Date().toISOString().split('T')[0]

      const res = await fetch(`/api/library/${userBookId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        toast.success(`Moved to ${shelf.replace('_', ' ')}`)
        router.refresh()
      } else {
        toast.error('Failed to update shelf')
      }
    })
  }

  function handleDelete() {
    if (!confirm('Remove this book from your library?')) return
    startTransition(async () => {
      const res = await fetch(`/api/library/${userBookId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Removed from library')
        router.push('/library')
      } else {
        toast.error('Failed to remove book')
      }
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isPending}>
          Move to <ChevronDown className="ml-1 h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {SHELF_OPTIONS.filter((o) => o.value !== currentShelf).map((o) => (
          <DropdownMenuItem key={o.value} onClick={() => moveToShelf(o.value)}>
            {o.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleDelete}>
          <Trash2 className="mr-2 h-3 w-3" /> Remove from library
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
