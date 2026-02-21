import { describe, test, expect } from 'vitest'
import { volumeToBookData } from './google-books'
import type { GoogleBooksVolume } from '@readrise/types'

const fullVolume: GoogleBooksVolume = {
  id: 'abc123',
  volumeInfo: {
    title: 'Clean Code',
    subtitle: 'A Handbook of Agile Software Craftsmanship',
    authors: ['Robert C. Martin'],
    description: 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees.',
    pageCount: 431,
    imageLinks: {
      thumbnail: 'http://books.google.com/books/content?id=abc123&printsec=frontcover&img=1&zoom=1&source=gbs_api',
    },
    categories: ['Computers / Software Development & Engineering'],
    publishedDate: '2008-08-01',
    publisher: 'Prentice Hall',
    language: 'en',
    industryIdentifiers: [
      { type: 'ISBN_13', identifier: '9780132350884' },
      { type: 'ISBN_10', identifier: '0132350882' },
    ],
  },
}

describe('volumeToBookData', () => {
  test('maps all fields from a complete volume', () => {
    const result = volumeToBookData(fullVolume)
    expect(result.googleBooksId).toBe('abc123')
    expect(result.title).toBe('Clean Code')
    expect(result.subtitle).toBe('A Handbook of Agile Software Craftsmanship')
    expect(result.authors).toEqual(['Robert C. Martin'])
    expect(result.pageCount).toBe(431)
    expect(result.publisher).toBe('Prentice Hall')
    expect(result.language).toBe('en')
    expect(result.publishedDate).toBe('2008-08-01')
    expect(result.genres).toEqual(['Computers / Software Development & Engineering'])
  })

  test('extracts ISBN_13 and ISBN_10', () => {
    const result = volumeToBookData(fullVolume)
    expect(result.isbn13).toBe('9780132350884')
    expect(result.isbn10).toBe('0132350882')
  })

  test('upgrades cover URL to https and zoom=2', () => {
    const result = volumeToBookData(fullVolume)
    expect(result.coverUrl).toContain('https://')
    expect(result.coverUrl).toContain('zoom=2')
    expect(result.coverUrl).not.toContain('http://')
    expect(result.coverUrl).not.toContain('zoom=1')
  })

  test('missing imageLinks → coverUrl is null', () => {
    const vol = { ...fullVolume, volumeInfo: { ...fullVolume.volumeInfo, imageLinks: undefined } }
    expect(volumeToBookData(vol).coverUrl).toBeNull()
  })

  test('missing authors → empty array', () => {
    const vol = { ...fullVolume, volumeInfo: { ...fullVolume.volumeInfo, authors: undefined } }
    expect(volumeToBookData(vol).authors).toEqual([])
  })

  test('missing categories → empty array', () => {
    const vol = { ...fullVolume, volumeInfo: { ...fullVolume.volumeInfo, categories: undefined } }
    expect(volumeToBookData(vol).genres).toEqual([])
  })

  test('missing optional fields default to null', () => {
    const vol: GoogleBooksVolume = {
      id: 'min',
      volumeInfo: { title: 'Minimal Book' },
    }
    const result = volumeToBookData(vol)
    expect(result.subtitle).toBeNull()
    expect(result.description).toBeNull()
    expect(result.coverUrl).toBeNull()
    expect(result.pageCount).toBeNull()
    expect(result.publishedDate).toBeNull()
    expect(result.publisher).toBeNull()
    expect(result.language).toBeNull()
    expect(result.isbn10).toBeNull()
    expect(result.isbn13).toBeNull()
  })

  test('prefers ISBN_13 over ISBN_10 when both present', () => {
    const result = volumeToBookData(fullVolume)
    expect(result.isbn13).toBe('9780132350884')
  })
})
