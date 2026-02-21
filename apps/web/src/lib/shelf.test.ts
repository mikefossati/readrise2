import { describe, test, expect } from 'vitest'
import { mapShelf } from './shelf'

describe('mapShelf', () => {
  test('"read" → finished', () => {
    expect(mapShelf('read')).toBe('finished')
  })

  test('case-insensitive: "Read" → finished', () => {
    expect(mapShelf('Read')).toBe('finished')
  })

  test('"currently-reading" → reading', () => {
    expect(mapShelf('currently-reading')).toBe('reading')
  })

  test('"to-read" → want_to_read', () => {
    expect(mapShelf('to-read')).toBe('want_to_read')
  })

  test('unknown value defaults to want_to_read', () => {
    expect(mapShelf('custom-shelf')).toBe('want_to_read')
  })

  test('empty string defaults to want_to_read', () => {
    expect(mapShelf('')).toBe('want_to_read')
  })
})
