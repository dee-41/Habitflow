import { useNow } from './useNow.js'
import { toDateKey } from '../lib/dates.js'

/**
 * Today's "yyyy-MM-dd" key. Re-evaluates every 30 seconds and when the tab
 * becomes visible, so it rolls over at midnight without a reload.
 */
export function useToday() {
  const now = useNow(30_000)
  return toDateKey(new Date(now))
}