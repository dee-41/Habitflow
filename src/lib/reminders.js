import { format, isToday, isTomorrow, isSameYear } from 'date-fns'

/** 'due' (pending, time reached) | 'upcoming' (pending, future) | 'past' */
export function getReminderBucket(reminder, now) {
  if (reminder.status !== 'pending') return 'past'
  return reminder.remindAt <= now ? 'due' : 'upcoming'
}

/** e.g. "Today, 9:30 PM", "Tomorrow, 9:30 AM", "Sat 24 Oct, 8:00 AM" */
export function formatReminderTime(ms) {
  const d = new Date(ms)
  const time = format(d, 'h:mm a')
  if (isToday(d)) return `Today, ${time}`
  if (isTomorrow(d)) return `Tomorrow, ${time}`
  return isSameYear(d, new Date())
    ? format(d, 'EEE d MMM, h:mm a')
    : format(d, 'd MMM yyyy, h:mm a')
}