import { describe, test, expect } from 'vitest'
import { calculateStreak } from './streak'

// Helper: build ISO date string N days before a reference date
function daysAgo(n: number, from = '2024-06-15'): string {
  const d = new Date(from)
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]!
}

const TODAY = '2024-06-15'

describe('calculateStreak', () => {
  test('empty array → both streaks 0', () => {
    expect(calculateStreak([], TODAY)).toEqual({ currentStreak: 0, longestStreak: 0 })
  })

  test('today only → currentStreak 1, longestStreak 1', () => {
    expect(calculateStreak([TODAY], TODAY)).toEqual({ currentStreak: 1, longestStreak: 1 })
  })

  test('yesterday only → currentStreak 1, longestStreak 1', () => {
    const yesterday = daysAgo(1, TODAY)
    expect(calculateStreak([yesterday], TODAY)).toEqual({ currentStreak: 1, longestStreak: 1 })
  })

  test('5 consecutive days including today', () => {
    const days = [0, 1, 2, 3, 4].map((n) => daysAgo(n, TODAY))
    expect(calculateStreak(days, TODAY)).toEqual({ currentStreak: 5, longestStreak: 5 })
  })

  test('gap: today + long run from 3 weeks ago', () => {
    const recent = [TODAY]
    const old = [20, 21, 22].map((n) => daysAgo(n, TODAY))
    // Gap at days 1-19, so currentStreak = 1, longestStreak = 3
    expect(calculateStreak([...recent, ...old], TODAY)).toEqual({
      currentStreak: 1,
      longestStreak: 3,
    })
  })

  test('3-day run ending yesterday (no session today)', () => {
    const days = [1, 2, 3].map((n) => daysAgo(n, TODAY))
    expect(calculateStreak(days, TODAY)).toEqual({ currentStreak: 3, longestStreak: 3 })
  })
})
