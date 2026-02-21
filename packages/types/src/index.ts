// Shared types used across web and API
// These mirror the DB schema but are safe to import in client components

export type SubscriptionTier = 'free' | 'reader' | 'bibliophile'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing'
export type Shelf = 'reading' | 'want_to_read' | 'finished' | 'abandoned'
export type BookFormat = 'physical' | 'ebook' | 'audiobook'
export type GoalType = 'book_count'

// ─── User ────────────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  displayName: string
  avatarUrl: string | null
  subscriptionTier: SubscriptionTier
  subscriptionStatus: SubscriptionStatus
  createdAt: string
}

// ─── Book ────────────────────────────────────────────────────────────────────

export interface Book {
  id: string
  googleBooksId: string
  isbn10: string | null
  isbn13: string | null
  title: string
  subtitle: string | null
  authors: string[]
  description: string | null
  coverUrl: string | null
  pageCount: number | null
  genres: string[]
  publishedDate: string | null
  publisher: string | null
  language: string | null
}

// ─── UserBook ─────────────────────────────────────────────────────────────────

export interface UserBook {
  id: string
  userId: string
  bookId: string
  book: Book
  shelf: Shelf
  format: BookFormat
  startedAt: string | null
  finishedAt: string | null
  abandonedAt: string | null
  rereadNumber: number
  createdAt: string
  updatedAt: string
  // Populated on demand
  currentPage?: number | null
  review?: Review | null
}

// ─── ProgressEntry ────────────────────────────────────────────────────────────

export interface ProgressEntry {
  id: string
  userBookId: string
  page: number
  percent: number
  loggedAt: string
  note: string | null
}

// ─── ReadingSession ───────────────────────────────────────────────────────────

export interface ReadingSession {
  id: string
  userBookId: string
  startedAt: string
  endedAt: string | null
  durationSeconds: number | null
  pagesStart: number | null
  pagesEnd: number | null
  pagesRead: number | null
  pagesPerHour: number | null
  note: string | null
}

// ─── Review ───────────────────────────────────────────────────────────────────

export interface Review {
  id: string
  userBookId: string
  rating: number
  body: string | null
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

// ─── UserGoal ─────────────────────────────────────────────────────────────────

export interface UserGoal {
  id: string
  userId: string
  year: number
  goalType: GoalType
  target: number
  createdAt: string
  updatedAt: string
}

// ─── ReadingStreak ────────────────────────────────────────────────────────────

export interface ReadingStreak {
  currentStreak: number
  longestStreak: number
  lastActiveDate: string | null
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface ReadingStats {
  booksReadThisYear: number
  totalPagesAllTime: number
  totalPagesThisYear: number
  totalHoursAllTime: number
  totalHoursThisYear: number
  averagePagesPerHour: number | null
  genreBreakdown: GenreCount[]
  streak: ReadingStreak
}

export interface GenreCount {
  genre: string
  count: number
}

// ─── API response wrappers ───────────────────────────────────────────────────

export interface ApiSuccess<T> {
  data: T
  error: null
}

export interface ApiError {
  data: null
  error: {
    code: string
    message: string
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

// ─── Google Books ─────────────────────────────────────────────────────────────

export interface GoogleBooksVolume {
  id: string
  volumeInfo: {
    title: string
    subtitle?: string
    authors?: string[]
    description?: string
    industryIdentifiers?: Array<{ type: string; identifier: string }>
    pageCount?: number
    categories?: string[]
    publishedDate?: string
    publisher?: string
    language?: string
    imageLinks?: {
      thumbnail?: string
      smallThumbnail?: string
    }
  }
}
