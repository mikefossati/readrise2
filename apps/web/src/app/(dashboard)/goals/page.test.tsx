import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import GoalsPage from './page'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const GOAL = { id: 'g1', year: 2026, goalType: 'book_count', target: 12, createdAt: '2026-01-01' }
const STATS = {
  booksReadThisYear: 3,
  totalPagesAllTime: 100,
  totalPagesThisYear: 50,
  totalHoursAllTime: 2,
  averagePagesPerHour: 30,
  genreBreakdown: [],
  streak: { currentStreak: 1, longestStreak: 2, lastActiveDate: '2026-01-01' },
}

function mockFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      if (String(url).includes('/api/goals'))
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: [GOAL] }) })
      if (String(url).includes('/api/stats'))
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: STATS }) })
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    }),
  )
}

beforeEach(() => {
  mockFetch()
})

describe('GoalsPage', () => {
  test('renders books-read count from stats API response', async () => {
    render(<GoalsPage />)
    // Waits for useEffect fetch to resolve and component to re-render
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument()
    })
  })

  test('renders goal target from goals API response', async () => {
    render(<GoalsPage />)
    await waitFor(() => {
      expect(screen.getByText(/2026 Book Goal/i)).toBeInTheDocument()
    })
    // "/ 12" is the denominator in the progress display
    expect(screen.getByText('/ 12')).toBeInTheDocument()
  })

  test('shows no-goal card when goals API returns empty array', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (String(url).includes('/api/goals'))
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: [] }) })
        if (String(url).includes('/api/stats'))
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: STATS }) })
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      }),
    )
    render(<GoalsPage />)
    await waitFor(() => {
      expect(screen.getByText(/No goal set for/i)).toBeInTheDocument()
    })
  })
})
