import { differenceInCalendarDays, subDays } from 'date-fns'
import { fromDateKey, toDateKey } from './dates.js'

/**
 * Calculates streak numbers from completion date keys ("yyyy-MM-dd").
 * - Duplicates and future dates are ignored.
 * - current: consecutive days ending today, or ending yesterday if today
 *   isn't marked yet (the streak is still alive until the day is over).
 * - longest: the longest run of consecutive days ever.
 */
export function calculateStreaks(dateKeys, today) {
  const days = [...new Set(dateKeys)].filter((k) => k <= today).sort()
  if (days.length === 0) return { current: 0, longest: 0, total: 0 }

  let longest = 1
  let run = 1
  for (let i = 1; i < days.length; i++) {
    const gap = differenceInCalendarDays(fromDateKey(days[i]), fromDateKey(days[i - 1]))
    run = gap === 1 ? run + 1 : 1
    if (run > longest) longest = run
  }

  const set = new Set(days)
  let cursor = fromDateKey(today)
  if (!set.has(today)) cursor = subDays(cursor, 1)
  let current = 0
  while (set.has(toDateKey(cursor))) {
    current++
    cursor = subDays(cursor, 1)
  }

  return { current, longest, total: days.length }
}