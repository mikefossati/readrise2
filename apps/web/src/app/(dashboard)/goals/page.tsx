'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Target, Trophy, BookOpen } from 'lucide-react'
import { toast } from 'sonner'

interface Goal {
  id: string
  year: number
  goalType: string
  target: number
  createdAt: string
}

interface Stats {
  booksThisYear: number
}

export default function GoalsPage() {
  const thisYear = new Date().getFullYear()

  const [goal, setGoal] = useState<Goal | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [target, setTarget] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [goalsRes, statsRes] = await Promise.all([
          fetch(`/api/goals?year=${thisYear}`),
          fetch('/api/stats'),
        ])
        const goalsData = await goalsRes.json()
        const statsData = await statsRes.json()

        const bookGoal = goalsData.goals?.find((g: Goal) => g.goalType === 'book_count') ?? null
        setGoal(bookGoal)
        setTarget(bookGoal ? String(bookGoal.target) : '')
        setStats({ booksThisYear: statsData.booksThisYear ?? 0 })
      } catch {
        toast.error('Failed to load goal data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [thisYear])

  async function handleSave() {
    const num = parseInt(target, 10)
    if (!num || num < 1 || num > 9999) {
      toast.error('Enter a number between 1 and 9999')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: thisYear, goalType: 'book_count', target: num }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setGoal(data.goal)
      toast.success('Reading goal saved!')
    } catch {
      toast.error('Failed to save goal')
    } finally {
      setSaving(false)
    }
  }

  const booksRead = stats?.booksThisYear ?? 0
  const goalTarget = goal?.target ?? 0
  const percent = goalTarget > 0 ? Math.min(Math.round((booksRead / goalTarget) * 100), 100) : 0
  const remaining = Math.max(goalTarget - booksRead, 0)

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Reading Goals</h1>
          <p className="text-sm text-muted-foreground">Set and track your annual reading targets</p>
        </div>
        <div className="h-40 animate-pulse rounded-lg bg-muted" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reading Goals</h1>
        <p className="text-sm text-muted-foreground">Set and track your annual reading targets</p>
      </div>

      {/* Goal Progress */}
      {goal ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {thisYear} Book Goal
            </CardTitle>
            <CardDescription>
              {percent === 100
                ? 'You hit your goal! Amazing work.'
                : `${remaining} book${remaining !== 1 ? 's' : ''} to go`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-4xl font-bold">{booksRead}</span>
                <span className="ml-1 text-lg text-muted-foreground">/ {goalTarget}</span>
              </div>
              <span className="text-2xl font-semibold text-muted-foreground">{percent}%</span>
            </div>
            <Progress value={percent} className="h-3" />
            {percent === 100 && (
              <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
                <Trophy className="h-4 w-4" />
                Goal complete — you&apos;ve read {booksRead} books this year!
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium">No goal set for {thisYear}</p>
              <p className="text-sm text-muted-foreground">Set a goal below to start tracking your progress</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Set / Update Goal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{goal ? 'Update goal' : 'Set a goal'}</CardTitle>
          <CardDescription>How many books do you want to read in {thisYear}?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1 space-y-1">
              <Label htmlFor="target">Books to read</Label>
              <Input
                id="target"
                type="number"
                min={1}
                max={9999}
                placeholder="e.g. 24"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSave} disabled={saving || !target}>
                {saving ? 'Saving…' : goal ? 'Update' : 'Set goal'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick presets */}
      <div className="flex flex-wrap gap-2">
        {[12, 24, 36, 52].map((n) => (
          <Button
            key={n}
            variant="outline"
            size="sm"
            onClick={() => setTarget(String(n))}
            className={target === String(n) ? 'border-primary' : ''}
          >
            {n} books
          </Button>
        ))}
      </div>
    </div>
  )
}
