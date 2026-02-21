import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { BookSearch } from './book-search'

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) =>
    React.createElement('img', { src, alt }),
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

const mockSearchResult = {
  id: 'vol-1',
  volumeInfo: {
    title: 'Clean Code',
    authors: ['Robert C. Martin'],
    pageCount: 431,
    imageLinks: { thumbnail: 'https://books.google.com/cover.jpg' },
  },
}

function successSearchResponse(items = [mockSearchResult]) {
  return {
    ok: true,
    json: async () => ({ data: items }),
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('BookSearch', () => {
  test('renders Add book button', () => {
    render(<BookSearch />)
    expect(screen.getByRole('button', { name: /add book/i })).toBeInTheDocument()
  })

  test('no fetch fired for query shorter than 2 characters', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })
    render(<BookSearch />)

    await user.click(screen.getByRole('button', { name: /add book/i }))
    await user.type(screen.getByPlaceholderText(/search by title/i), 'a')

    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    expect(mockFetch).not.toHaveBeenCalled()
  })

  test('debounce: fires exactly one request after 350ms for a valid query', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })
    mockFetch.mockResolvedValue(successSearchResponse())

    render(<BookSearch />)
    await user.click(screen.getByRole('button', { name: /add book/i }))
    await user.type(screen.getByPlaceholderText(/search by title/i), 'Clean Code')

    // Before debounce fires
    expect(mockFetch).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(400)
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/books/search?q='),
      expect.anything(),
    )
  })

  test('renders search results after successful response', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })
    mockFetch.mockResolvedValue(successSearchResponse())

    render(<BookSearch />)
    await user.click(screen.getByRole('button', { name: /add book/i }))
    await user.type(screen.getByPlaceholderText(/search by title/i), 'Clean Code')

    await act(async () => {
      vi.advanceTimersByTime(400)
    })
    // wait for the promise to resolve
    await act(async () => {})

    expect(screen.getByText('Clean Code')).toBeInTheDocument()
  })

  test('shows error message on failed search response', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'API error' }),
    })

    render(<BookSearch />)
    await user.click(screen.getByRole('button', { name: /add book/i }))
    await user.type(screen.getByPlaceholderText(/search by title/i), 'Clean Code')

    await act(async () => {
      vi.advanceTimersByTime(400)
    })
    await act(async () => {})

    expect(screen.getByText('API error')).toBeInTheDocument()
  })

  test('shows "No results found" when results array is empty', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })
    mockFetch.mockResolvedValue(successSearchResponse([]))

    render(<BookSearch />)
    await user.click(screen.getByRole('button', { name: /add book/i }))
    await user.type(screen.getByPlaceholderText(/search by title/i), 'xyzabc123')

    await act(async () => {
      vi.advanceTimersByTime(400)
    })
    await act(async () => {})

    expect(screen.getByText(/no results found/i)).toBeInTheDocument()
  })

  test('clicking Add fires POST to /api/library', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })
    mockFetch
      .mockResolvedValueOnce(successSearchResponse())
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: {} }) })

    render(<BookSearch />)
    await user.click(screen.getByRole('button', { name: /add book/i }))
    await user.type(screen.getByPlaceholderText(/search by title/i), 'Clean Code')

    await act(async () => { vi.advanceTimersByTime(400) })
    await act(async () => {})

    await user.click(screen.getAllByRole('button', { name: /^add$/i })[0]!)

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/library',
      expect.objectContaining({ method: 'POST' }),
    )
  })
})
