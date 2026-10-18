import {
  format,
  parseISO,
  parse,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
} from 'date-fns'

/**
 * DATE CONVENTIONS (used across the whole app)
 * - Calendar days (due dates, streak completions) are stored as local-time
 *   "yyyy-MM-dd" strings, e.g. "2026-10-15". They sort correctly as plain
 *   strings and never shift with timezones.
 * - Times of day are stored as "HH:mm" strings.
 * - Exact moments (createdAt, remindAt) are stored as epoch milliseconds.
 */

export const DATE_KEY_FORMAT = 'yyyy-MM-dd'

/** 0 = Sunday, 1 = Monday. Change this to switch the calendar's first day. */
export const WEEK_STARTS_ON = 0

export const WEEKDAY_LABELS =
  WEEK_STARTS_ON === 1
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Date -> "yyyy-MM-dd" in the user's local timezone. */
export function toDateKey(date) {
  return format(date, DATE_KEY_FORMAT)
}

/** Today's date key in local time. */
export function todayKey() {
  return toDateKey(new Date())
}

/** "yyyy-MM-dd" -> Date at local midnight. */
export function fromDateKey(key) {
  return parseISO(key)
}

/** "yyyy-MM-dd" + optional "HH:mm" -> epoch ms in local time. */
export function dateTimeToMs(dateKey, time = '00:00') {
  return new Date(`${dateKey}T${time}:00`).getTime()
}

/** e.g. "Thursday, 15 October 2026" */
export function formatLongDate(date) {
  return format(date, 'EEEE, d MMMM yyyy')
}

/** e.g. "15 Oct 2026, 9:30 PM" from epoch milliseconds. */
export function formatTimestamp(ms) {
  return format(new Date(ms), 'd MMM yyyy, h:mm a')
}

/** "21:30" -> "9:30 PM" */
export function formatTime(time) {
  return format(parse(time, 'HH:mm', new Date()), 'h:mm a')
}

/** All days shown in a month grid, padded to whole weeks. */
export function getMonthGrid(monthDate) {
  const start = startOfWeek(startOfMonth(monthDate), {
    weekStartsOn: WEEK_STARTS_ON,
  })
  const end = endOfWeek(endOfMonth(monthDate), {
    weekStartsOn: WEEK_STARTS_ON,
  })
  return eachDayOfInterval({ start, end })
}