import Link from 'next/link'
import Image from 'next/image'
import { Progress } from '@/components/ui/progress'

interface BookCardProps {
  userBookId: string
  title: string
  authors: string[]
  coverUrl: string | null
  shelf: string
  pageCount: number | null
  currentPage?: number | null
  rating?: number | null
}

export function BookCard({
  userBookId,
  title,
  authors,
  coverUrl,
  shelf,
  pageCount,
  currentPage,
  rating,
}: BookCardProps) {
  const percent = pageCount && currentPage ? Math.round((currentPage / pageCount) * 100) : null

  return (
    <Link
      href={`/books/${userBookId}`}
      className="group flex flex-col gap-2 rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative mx-auto aspect-[2/3] w-full max-w-[100px] overflow-hidden rounded bg-muted">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="100px"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-2 text-center text-xs text-muted-foreground">
            {title}
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="line-clamp-2 text-sm font-medium leading-tight">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{authors.join(', ')}</p>
        {rating != null && (
          <p className="text-xs text-yellow-500">{'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}</p>
        )}
        {percent != null && shelf === 'reading' && (
          <div className="space-y-0.5">
            <Progress value={percent} className="h-1" />
            <p className="text-xs text-muted-foreground">{percent}%</p>
          </div>
        )}
      </div>
    </Link>
  )
}
