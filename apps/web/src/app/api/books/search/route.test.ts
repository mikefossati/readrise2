import { describe, test, expect, vi, afterEach } from 'vitest'
import { GET } from './route'

function makeReq(query?: string): Request {
  const url = `http://test/api/books/search${query ? `?q=${encodeURIComponent(query)}` : ''}`
  return new Request(url, { method: 'GET' })
}

describe('GET /api/books/search', () => {
  afterEach(() => vi.unstubAllGlobals())

  test('returns results from Google Books when query matches', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            items: [
              {
                id: 'vol-001',
                volumeInfo: { title: 'The Pragmatic Programmer' },
              },
            ],
          }),
      }),
    )

    const res = await GET(makeReq('pragmatic'))
    expect(res.status).toBe(200)
    const { data } = await res.json()
    expect(data).toHaveLength(1)
    expect(data[0].id).toBe('vol-001')
  })

  test('returns empty array when query is too short', async () => {
    const res = await GET(makeReq('a'))
    expect(res.status).toBe(200)
    const { data } = await res.json()
    expect(data).toHaveLength(0)
  })

  test('returns empty array when query is missing', async () => {
    const res = await GET(makeReq())
    expect(res.status).toBe(200)
    const { data } = await res.json()
    expect(data).toHaveLength(0)
  })
})
