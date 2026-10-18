import { useEffect } from 'react'
import { claimDueReminders } from '../db/remindersRepo.js'
import { notificationsSupported, showNotification } from '../lib/notifications.js'
import { formatReminderTime } from '../lib/reminders.js'

const CHECK_EVERY_MS = 15_000
// Reminders that were due longer ago than this are not announced on open.
const GRACE_MS = 60 * 60 * 1000

/**
 * Mounted once (in AppLayout) so reminders fire on any page.
 * Works only while the app is open; see the limitations in the Reminders page.
 */
export function useReminderNotifications() {
  useEffect(() => {
    async function check() {
      // Don't claim anything unless we can actually notify, so nothing is
      // silently marked as "notified" while permission is missing.
      if (!notificationsSupported() || Notification.permission !== 'granted') return
      try {
        const due = await claimDueReminders(Date.now(), GRACE_MS)
        for (const r of due) {
          showNotification(r.title, `Reminder for ${formatReminderTime(r.remindAt)}`, r.id)
        }
      } catch (err) {
        console.error('Reminder check failed:', err)
      }
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') check()
    }

    check()
    const id = setInterval(check, CHECK_EVERY_MS)
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', check)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', check)
    }
  }, [])
}