import type { GoogleBooksVolume } from '@readrise/types'

const BASE_URL = 'https://www.googleapis.com/books/v1'

export async function searchBooks(query: string, maxResults = 10): Promise<GoogleBooksVolume[]> {
  const params = new URLSearchParams({
    q: query,
    maxResults: String(maxResults),
    printType: 'books',
    ...(process.env.GOOGLE_BOOKS_API_KEY && { key: process.env.GOOGLE_BOOKS_API_KEY }),
  })

  const res = await fetch(`${BASE_URL}/volumes?${params}`, { cache: 'no-store' })

  if (!res.ok) {
    console.error('[google-books] search failed', res.status, await res.text())
    return []
  }

  const data = await res.json()
  return (data.items ?? []) as GoogleBooksVolume[]
}

export async function getVolumeById(id: string): Promise<GoogleBooksVolume | null> {
  const params = new URLSearchParams()
  if (process.env.GOOGLE_BOOKS_API_KEY) params.set('key', process.env.GOOGLE_BOOKS_API_KEY)
  const qs = params.size ? `?${params}` : ''
  const res = await fetch(`${BASE_URL}/volumes/${id}${qs}`, { next: { revalidate: 86400 } })
  if (!res.ok) return null
  return res.json()
}

export async function getBookByIsbn(isbn: string): Promise<GoogleBooksVolume | null> {
  const params = new URLSearchParams({
    q: `isbn:${isbn}`,
    maxResults: '1',
    ...(process.env.GOOGLE_BOOKS_API_KEY && { key: process.env.GOOGLE_BOOKS_API_KEY }),
  })

  const res = await fetch(`${BASE_URL}/volumes?${params}`, {
    next: { revalidate: 86400 }, // cache for 24 hours
  })

  if (!res.ok) return null

  const data = await res.json()
  return data.items?.[0] ?? null
}

export function volumeToBookData(volume: GoogleBooksVolume) {
  const info = volume.volumeInfo
  const isbn13 = info.industryIdentifiers?.find((id) => id.type === 'ISBN_13')?.identifier
  const isbn10 = info.industryIdentifiers?.find((id) => id.type === 'ISBN_10')?.identifier

  // Google Books thumbnail URLs — upgrade to https and get larger size
  const coverUrl = info.imageLinks?.thumbnail
    ? info.imageLinks.thumbnail.replace('http://', 'https://').replace('zoom=1', 'zoom=2')
    : null

  return {
    googleBooksId: volume.id,
    isbn10: isbn10 ?? null,
    isbn13: isbn13 ?? null,
    title: info.title,
    subtitle: info.subtitle ?? null,
    authors: info.authors ?? [],
    description: info.description ?? null,
    coverUrl,
    pageCount: info.pageCount ?? null,
    genres: info.categories ?? [],
    publishedDate: info.publishedDate ?? null,
    publisher: info.publisher ?? null,
    language: info.language ?? null,
  }
}
