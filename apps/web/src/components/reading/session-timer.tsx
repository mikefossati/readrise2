'use client'

import { useState, useEffect, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Play, Square, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { formatDuration } from '@/lib/format'

interface SessionTimerProps {
  userBookId: string
  currentPage: number | null
  activeSessionId: string | null
  activeSessionStart: string | null
}

export function SessionTimer({
  userBookId,
  currentPage,
  activeSessionId: initialSessionId,
  activeSessionStart: initialStart,
}: SessionTimerProps) {
  const [sessionId, setSessionId] = useState(initialSessionId)
  const [startTime, setStartTime] = useState(initialStart ? new Date(initialStart) : null)
  const [elapsed, setElapsed] = useState(0)
  const [endPage, setEndPage] = useState(currentPage ?? 0)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // Tick
  useEffect(() => {
    if (!startTime) return
    const tick = () => setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startTime])

  function handleStart() {
    startTransition(async () => {
      const res = await fetch(`/api/library/${userBookId}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pagesStart: currentPage }),
      })
      if (res.ok) {
        const { data } = await res.json()
        setSessionId(data.id)
        setStartTime(new Date(data.startedAt))
        toast.success('Session started')
      } else {
        toast.error('Failed to start session')
      }
    })
  }

  function handleStop() {
    if (!sessionId) return
    startTransition(async () => {
      const res = await fetch(`/api/library/${userBookId}/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pagesEnd: endPage }),
      })
      if (res.ok) {
        const { data } = await res.json()
        setSessionId(null)
        setStartTime(null)
        const speed = data.pagesPerHour ? ` · ${Math.round(data.pagesPerHour)} pages/hr` : ''
        toast.success(`Session saved — ${formatDuration(data.durationSeconds)}${speed}`)
        router.refresh()
      } else {
        toast.error('Failed to stop session')
      }
    })
  }

  const isActive = !!sessionId

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="font-mono text-lg">
          {isActive ? formatDuration(elapsed) : '00:00:00'}
        </span>
        {!isActive ? (
          <Button size="sm" onClick={handleStart} disabled={isPending}>
            <Play className="mr-1 h-3 w-3" /> Start
          </Button>
        ) : (
          <Button size="sm" variant="destructive" onClick={handleStop} disabled={isPending}>
            <Square className="mr-1 h-3 w-3" /> Stop
          </Button>
        )}
      </div>
      {isActive && (
        <div className="flex items-center gap-2">
          <Label htmlFor="end-page" className="text-sm">End page</Label>
          <Input
            id="end-page"
            type="number"
            min={0}
            value={endPage}
            onChange={(e) => setEndPage(parseInt(e.target.value) || 0)}
            className="w-24"
          />
        </div>
      )}
    </div>
  )
}
