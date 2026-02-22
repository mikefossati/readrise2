'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { GoodreadsImport } from '@/components/import/goodreads-import'
import { BookSearch } from '@/components/books/book-search'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'

const STEPS = ['welcome', 'library', 'goal', 'done'] as const
type Step = (typeof STEPS)[number]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('welcome')
  const [name, setName] = useState('')
  const [originalName, setOriginalName] = useState('')
  const [goalTarget, setGoalTarget] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [savingGoal, setSavingGoal] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [libraryChoice, setLibraryChoice] = useState<'import' | 'search' | null>(null)

  useEffect(() => {
    // Pre-populate the name from the server
    fetch('/api/user/plan')
      .then((r) => r.json())
      .catch(() => null)
    // Fetch display name from auth metadata via a lightweight endpoint
    fetch('/api/user/profile')
      .then((r) => r.json())
      .then(({ data }) => {
        if (data?.displayName) {
          setName(data.displayName)
          setOriginalName(data.displayName)
        }
      })
      .catch(() => null)
  }, [])

  async function handleWelcomeContinue() {
    if (name.trim() && name !== originalName) {
      setSavingName(true)
      try {
        await fetch('/api/user/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ displayName: name.trim() }),
        })
      } catch {
        toast.error('Failed to save name — you can update it later in settings.')
      } finally {
        setSavingName(false)
      }
    }
    setStep('library')
  }

  async function handleSetGoal() {
    const target = parseInt(goalTarget, 10)
    if (!target || target < 1) {
      toast.error('Please enter a valid book count.')
      return
    }
    setSavingGoal(true)
    try {
      await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: new Date().getFullYear(), target, goalType: 'book_count' }),
      })
      setStep('done')
    } catch {
      toast.error('Failed to save goal — you can set it later on the Goals page.')
      setStep('done')
    } finally {
      setSavingGoal(false)
    }
  }

  async function handleComplete() {
    setCompleting(true)
    try {
      await fetch('/api/user/onboarding', { method: 'POST' })
      router.push('/library')
    } catch {
      router.push('/library')
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <Toaster richColors />

      {/* Progress dots */}
      <div className="mb-8 flex gap-2">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`h-2 w-2 rounded-full transition-colors ${
              STEPS.indexOf(step) >= i ? 'bg-foreground' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      <div className="w-full max-w-md">
        {/* Step 1: Welcome */}
        {step === 'welcome' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 justify-center">
              <BookOpen className="h-7 w-7" />
              <span className="text-2xl font-bold">ReadRise</span>
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold">Welcome{name ? `, ${name}` : ''}!</h1>
              <p className="mt-2 text-muted-foreground">Let&apos;s set up your reading profile in 3 quick steps.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Your name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="How should we call you?"
              />
            </div>
            <Button
              className="w-full"
              onClick={handleWelcomeContinue}
              disabled={savingName || !name.trim()}
            >
              {savingName ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 2: Library */}
        {step === 'library' && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold">Start your library</h1>
              <p className="mt-2 text-muted-foreground">Add your first books — or skip and do it later.</p>
            </div>

            {!libraryChoice && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Card
                  className="cursor-pointer hover:border-foreground transition-colors"
                  onClick={() => setLibraryChoice('import')}
                >
                  <CardContent className="pt-6 text-center space-y-2">
                    <p className="font-semibold">Import from Goodreads</p>
                    <p className="text-sm text-muted-foreground">Upload your CSV export and bring everything over.</p>
                  </CardContent>
                </Card>
                <Card
                  className="cursor-pointer hover:border-foreground transition-colors"
                  onClick={() => setLibraryChoice('search')}
                >
                  <CardContent className="pt-6 text-center space-y-2">
                    <p className="font-semibold">Search & add manually</p>
                    <p className="text-sm text-muted-foreground">Find books by title or author and add them one by one.</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {libraryChoice === 'import' && (
              <div className="space-y-3">
                <GoodreadsImport />
              </div>
            )}

            {libraryChoice === 'search' && (
              <div className="flex justify-center">
                <BookSearch />
              </div>
            )}

            <div className="flex gap-2">
              {libraryChoice && (
                <Button variant="outline" className="flex-1" onClick={() => setLibraryChoice(null)}>
                  Back
                </Button>
              )}
              <Button
                variant={libraryChoice ? 'default' : 'ghost'}
                className="flex-1 text-muted-foreground"
                onClick={() => setStep('goal')}
              >
                Skip for now
              </Button>
              {libraryChoice && (
                <Button className="flex-1" onClick={() => setStep('goal')}>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Goal */}
        {step === 'goal' && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold">Set a reading goal</h1>
              <p className="mt-2 text-muted-foreground">
                How many books do you want to read in {new Date().getFullYear()}?
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal">Books this year</Label>
              <Input
                id="goal"
                type="number"
                min={1}
                max={1000}
                value={goalTarget}
                onChange={(e) => setGoalTarget(e.target.value)}
                placeholder="e.g. 24"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="flex-1 text-muted-foreground"
                onClick={() => setStep('done')}
              >
                Skip for now
              </Button>
              <Button
                className="flex-1"
                onClick={handleSetGoal}
                disabled={savingGoal || !goalTarget}
              >
                {savingGoal ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Set goal
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Done */}
        {step === 'done' && (
          <div className="space-y-6 text-center">
            <div className="text-5xl">🎉</div>
            <div>
              <h1 className="text-2xl font-bold">You&apos;re all set!</h1>
              <p className="mt-2 text-muted-foreground">
                Your reading life starts now. Track sessions, log progress, and watch your stats grow.
              </p>
            </div>
            <Button className="w-full" size="lg" onClick={handleComplete} disabled={completing}>
              {completing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Go to my library
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
