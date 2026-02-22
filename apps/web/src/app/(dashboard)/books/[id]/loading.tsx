import { Skeleton } from '@/components/ui/skeleton'

export default function BookDetailLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex gap-6">
        <Skeleton className="h-40 w-28 shrink-0 rounded-md" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      {/* Content cards */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card p-5 space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  )
}
