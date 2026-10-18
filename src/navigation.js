import { CalendarDays, Flame, ListChecks, Bell, Settings } from 'lucide-react'

// Single source of truth for sidebar + mobile navigation.
export const NAV_ITEMS = [
  { to: '/', label: 'Calendar', icon: CalendarDays, end: true },
  { to: '/streaks', label: 'Streaks', icon: Flame },
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/reminders', label: 'Reminders', icon: Bell },
  { to: '/settings', label: 'Settings', icon: Settings },
]