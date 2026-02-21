import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionTimer } from './session-timer'

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockFetch = vi.fn()
beforeEach(() => {
  vi.useFakeTimers()
  global.fetch = mockFetch
  mockFetch.mockReset()
})
afterEach(() => {
  vi.useRealTimers()
})

function noSessionProps() {
  return {
    userBookId: 'ub-1',
    currentPage: 50,
    activeSessionId: null,
    activeSessionStart: null,
  }
}

function activeSessionProps(startedAt = new Date().toISOString()) {
  return {
    userBookId: 'ub-1',
    currentPage: 50,
    activeSessionId: 'sess-1',
    activeSessionStart: startedAt,
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SessionTimer', () => {
  test('shows 00:00:00 and Start button when no active session', () => {
    render(<SessionTimer {...noSessionProps()} />)
    expect(screen.getByText('00:00:00')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /stop/i })).not.toBeInTheDocument()
  })

  test('shows Stop button when session is active', () => {
    render(<SessionTimer {...activeSessionProps()} />)
    expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /start/i })).not.toBeInTheDocument()
  })

  test('elapsed time increments every second while active', async () => {
    const startedAt = new Date().toISOString()
    render(<SessionTimer {...activeSessionProps(startedAt)} />)

    await act(async () => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.getByText('00:00:03')).toBeInTheDocument()
  })

  test('clicking Start fires POST to sessions endpoint', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: 'new-sess', startedAt: new Date().toISOString() } }),
    })

    render(<SessionTimer {...noSessionProps()} />)
    await user.click(screen.getByRole('button', { name: /start/i }))

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/library/ub-1/sessions',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  test('successful Start switches to active state', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: 'new-sess', startedAt: new Date().toISOString() } }),
    })

    render(<SessionTimer {...noSessionProps()} />)
    await user.click(screen.getByRole('button', { name: /start/i }))

    expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument()
  })

  test('clicking Stop fires PATCH with pagesEnd', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { durationSeconds: 120, pagesPerHour: null },
      }),
    })

    render(<SessionTimer {...activeSessionProps()} />)
    await user.click(screen.getByRole('button', { name: /stop/i }))

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/library/ub-1/sessions/sess-1',
      expect.objectContaining({
        method: 'PATCH',
        body: expect.stringContaining('pagesEnd'),
      }),
    )
  })

  test('failed Start shows error toast', async () => {
    const { toast } = await import('sonner')
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })
    mockFetch.mockResolvedValueOnce({ ok: false, json: async () => ({}) })

    render(<SessionTimer {...noSessionProps()} />)
    await user.click(screen.getByRole('button', { name: /start/i }))

    expect(toast.error).toHaveBeenCalledWith('Failed to start session')
  })
})
