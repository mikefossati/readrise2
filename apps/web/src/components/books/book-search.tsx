'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { Search, Plus, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import type { GoogleBooksVolume } from '@readrise/types'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export function BookSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GoogleBooksVolume[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const abortRef = useRef<AbortController | null>(null)

  // Debounce + abort: wait 350ms after typing stops, cancel any in-flight request
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      setSearching(false)
      return
    }

    setSearching(true)
    setSearchError(null)

    const timer = setTimeout(async () => {
      abortRef.current?.abort()
      abortRef.current = new AbortController()

      try {
        const res = await fetch(`/api/books/search?q=${encodeURIComponent(query.trim())}`, {
          signal: abortRef.current.signal,
        })
        const json = await res.json()
        if (!res.ok) {
          setSearchError(json.error ?? `Search failed (${res.status})`)
          setResults([])
        } else {
          setResults(json.data ?? [])
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setSearchError('Search failed — check your connection')
          setResults([])
        }
      } finally {
        setSearching(false)
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [query])

  // Reset state when dialog closes
  function handleOpenChange(v: boolean) {
    setOpen(v)
    if (!v) {
      setQuery('')
      setResults([])
      setSearchError(null)
      abortRef.current?.abort()
    }
  }

  async function handleAdd(volume: GoogleBooksVolume, shelf: string) {
    startTransition(async () => {
      const res = await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volume, shelf }),
      })
      if (res.ok) {
        toast.success(`Added to ${shelf.replace('_', ' ')}`)
        handleOpenChange(false)
        router.refresh()
      } else {
        toast.error('Failed to add book')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 h-4 w-4" /> Add book
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a book</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search by title or author…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {searching && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!searching && results.map((volume) => (
            <BookSearchResult
              key={volume.id}
              volume={volume}
              onAdd={handleAdd}
              disabled={isPending}
            />
          ))}
          {!searching && searchError && (
            <p className="py-4 text-center text-sm text-destructive">{searchError}</p>
          )}
          {!searching && !searchError && query.trim().length >= 2 && results.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">No results found</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function BookSearchResult({
  volume,
  onAdd,
  disabled,
}: {
  volume: GoogleBooksVolume
  onAdd: (v: GoogleBooksVolume, shelf: string) => void
  disabled: boolean
}) {
  const [shelf, setShelf] = useState('want_to_read')
  const info = volume.volumeInfo
  const cover = info.imageLinks?.thumbnail?.replace('http://', 'https://')

  return (
    <div className="flex items-start gap-3 rounded-md border p-3">
      <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded bg-muted">
        {cover ? (
          <Image src={cover} alt={info.title} fill className="object-cover" sizes="40px" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">?</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{info.title}</p>
        <p className="truncate text-xs text-muted-foreground">{info.authors?.join(', ')}</p>
        {info.pageCount && (
          <p className="text-xs text-muted-foreground">{info.pageCount} pages</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Select value={shelf} onValueChange={setShelf}>
          <SelectTrigger className="h-7 w-32 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="want_to_read">Want to read</SelectItem>
            <SelectItem value="reading">Reading</SelectItem>
            <SelectItem value="finished">Finished</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" className="h-7" onClick={() => onAdd(volume, shelf)} disabled={disabled}>
          Add
        </Button>
      </div>
    </div>
  )
}
