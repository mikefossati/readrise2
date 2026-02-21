import { describe, test, expect } from 'vitest'
import { formatDuration, formatDate } from './format'

describe('formatDuration', () => {
  test('zero seconds', () => {
    expect(formatDuration(0)).toBe('00:00:00')
  })

  test('null returns 00:00:00', () => {
    expect(formatDuration(null)).toBe('00:00:00')
  })

  test('sub-minute', () => {
    expect(formatDuration(45)).toBe('00:00:45')
  })

  test('exactly one minute', () => {
    expect(formatDuration(60)).toBe('00:01:00')
  })

  test('one hour one minute one second', () => {
    expect(formatDuration(3661)).toBe('01:01:01')
  })

  test('pads single digits with leading zero', () => {
    expect(formatDuration(3600 + 60 + 5)).toBe('01:01:05')
  })

  test('large value — 10 hours', () => {
    expect(formatDuration(36000)).toBe('10:00:00')
  })
})

describe('formatDate', () => {
  test('null returns em dash', () => {
    expect(formatDate(null)).toBe('—')
  })

  test('formats a valid ISO date string', () => {
    const result = formatDate('2024-06-15T00:00:00.000Z')
    // Locale-dependent but must include year and month
    expect(result).toMatch(/2024/)
    expect(result).toMatch(/Jun/)
  })
})
