/**
 * Returns the ISO date string N days offset from a given date string.
 */
function offsetDay(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().split('T')[0]!
}

/**
 * Calculates current and longest reading streaks from an array of session day strings.
 * @param days - ISO date strings (YYYY-MM-DD) sorted descending (most recent first),
 *               one entry per distinct day with at least one completed session.
 * @param today - Override today's date string (YYYY-MM-DD) for testing. Defaults to actual today.
 */
export function calculateStreak(
  days: string[],
  today = new Date().toISOString().split('T')[0]!,
): { currentStreak: number; longestStreak: number } {
  if (days.length === 0) return { currentStreak: 0, longestStreak: 0 }

  // A streak is "current" if it starts from today or yesterday
  const yesterdayStr = offsetDay(today, -1)
  const firstDay = days[0]!
  const isActive = firstDay === today || firstDay === yesterdayStr

  let currentStreak = 0
  let longestStreak = 0
  let streak = 1
  let currentStreakDone = false

  for (let i = 1; i < days.length; i++) {
    // Each consecutive day in descending order must be exactly 1 day before the previous
    const expected = offsetDay(days[i - 1]!, -1)
    if (days[i] === expected) {
      streak++
    } else {
      if (streak > longestStreak) longestStreak = streak
      if (isActive && !currentStreakDone) {
        currentStreak = streak
        currentStreakDone = true
      }
      streak = 1
    }
  }

  if (streak > longestStreak) longestStreak = streak
  if (isActive && !currentStreakDone) currentStreak = streak

  return { currentStreak, longestStreak }
}
