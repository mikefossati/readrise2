'use client'

import { useRef, useState } from 'react'
import Papa from 'papaparse'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Upload, CheckCircle2, XCircle } from 'lucide-react'

interface ImportResult {
  imported: number
  skipped: number
  errors: string[]
}

export function GoodreadsImport() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<'idle' | 'parsing' | 'importing' | 'done' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ImportResult | null>(null)

  function reset() {
    setStatus('idle')
    setProgress(0)
    setResult(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleOpenChange(v: boolean) {
    setOpen(v)
    if (!v) reset()
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setStatus('parsing')
    setProgress(10)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (parsed) => {
        const rows = parsed.data as Record<string, string>[]
        if (!rows.length) {
          toast.error('No rows found in CSV')
          setStatus('error')
          return
        }

        setStatus('importing')
        setProgress(30)

        // Chunk into batches of 100 to give progress feedback
        const batchSize = 100
        const batches = []
        for (let i = 0; i < rows.length; i += batchSize) {
          batches.push(rows.slice(i, i + batchSize))
        }

        let totalImported = 0
        let totalSkipped = 0
        const allErrors: string[] = []

        for (let i = 0; i < batches.length; i++) {
          try {
            const res = await fetch('/api/import/goodreads', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ rows: batches[i] }),
            })
            if (!res.ok) {
              const err = await res.json().catch(() => ({ error: 'Unknown error' }))
              allErrors.push(err.error ?? 'Batch failed')
            } else {
              const data = await res.json()
              totalImported += data.imported ?? 0
              totalSkipped += data.skipped ?? 0
              if (data.errors) allErrors.push(...data.errors)
            }
          } catch {
            allErrors.push(`Batch ${i + 1} failed`)
          }
          setProgress(30 + Math.round(((i + 1) / batches.length) * 65))
        }

        setProgress(100)
        setResult({ imported: totalImported, skipped: totalSkipped, errors: allErrors })
        setStatus('done')
      },
      error: () => {
        toast.error('Failed to parse CSV file')
        setStatus('error')
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="mr-2 h-4 w-4" />
          Import from Goodreads
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import from Goodreads</DialogTitle>
          <DialogDescription>
            Export your Goodreads library as a CSV and upload it here. Go to{' '}
            <span className="font-medium">My Books → Import/Export → Export Library</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {status === 'idle' && (
            <div
              className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors hover:border-primary hover:bg-muted/50"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Click to upload CSV</p>
                <p className="text-xs text-muted-foreground">Goodreads export file (.csv)</p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".csv"
                className="sr-only"
                onChange={handleFile}
              />
            </div>
          )}

          {(status === 'parsing' || status === 'importing') && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {status === 'parsing' ? 'Parsing CSV…' : 'Importing books…'}
              </p>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground">{progress}% complete</p>
            </div>
          )}

          {status === 'done' && result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>
                  Imported <strong>{result.imported}</strong> book
                  {result.imported !== 1 ? 's' : ''}
                  {result.skipped > 0 && `, skipped ${result.skipped}`}
                </span>
              </div>
              {result.errors.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-destructive">Some rows had issues:</p>
                  <ul className="max-h-32 overflow-y-auto space-y-0.5">
                    {result.errors.slice(0, 10).map((err, i) => (
                      <li key={i} className="flex items-start gap-1 text-xs text-muted-foreground">
                        <XCircle className="mt-0.5 h-3 w-3 shrink-0 text-destructive" />
                        {err}
                      </li>
                    ))}
                    {result.errors.length > 10 && (
                      <li className="text-xs text-muted-foreground">
                        …and {result.errors.length - 10} more
                      </li>
                    )}
                  </ul>
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={reset} className="flex-1">
                  Import another
                </Button>
                <Button size="sm" onClick={() => setOpen(false)} className="flex-1">
                  Done
                </Button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <XCircle className="h-4 w-4 shrink-0" />
                Import failed. Please check the file and try again.
              </div>
              <Button variant="outline" size="sm" onClick={reset} className="w-full">
                Try again
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
