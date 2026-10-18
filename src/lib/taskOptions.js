/** Reminder choices for a task. Values are minutes before the due moment. */
export const REMINDER_OPTIONS = [
  { value: '', label: 'No reminder' },
  { value: '0', label: 'At due time' },
  { value: '10', label: '10 minutes before' },
  { value: '60', label: '1 hour before' },
  { value: '1440', label: '1 day before' },
]

/** If a task has a date but no time, reminders are based on this time. */
export const DEFAULT_REMINDER_TIME = '09:00'