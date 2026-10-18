import { useState } from 'react'
import { Bell, BellOff, BellRing } from 'lucide-react'
import { getPermission, requestPermission, showNotification } from '../../lib/notifications.js'

const button =
  'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition'

export default function NotificationBanner() {
  const [permission, setPermission] = useState(getPermission)
  const [message, setMessage] = useState('')

  async function enable() {
    setMessage('')
    setPermission(await requestPermission())
  }

  function sendTest() {
    const ok = showNotification('HabitFlow', 'Notifications are working.', 'habitflow-test')
    setMessage(
      ok
        ? "Test sent. If you didn't see it, check your system's notification and Do Not Disturb settings."
        : "Your browser couldn't show a notification here. Reminders will still appear on this page.",
    )
  }

  const states = {
    unsupported: {
      icon: BellOff,
      tone: 'bg-slate-100 text-slate-500',
      title: "Notifications aren't supported in this browser",
      text: "Reminders will still show up on this page when they're due.",
    },
    default: {
      icon: Bell,
      tone: 'bg-emerald-50 text-emerald-600',
      title: 'Get notified when a reminder is due',
      text: 'Your browser will ask for permission when you turn this on.',
      action: (
        <button type="button" onClick={enable} className={`${button} bg-emerald-600 text-white hover:bg-emerald-700`}>
          Turn on notifications
        </button>
      ),
    },
    denied: {
      icon: BellOff,
      tone: 'bg-amber-50 text-amber-600',
      title: 'Notifications are blocked',
      text: "Allow them in your browser's site settings (usually the icon next to the address bar), then reload this page.",
    },
    granted: {
      icon: BellRing,
      tone: 'bg-emerald-50 text-emerald-600',
      title: 'Notifications are on',
      text: 'You will be notified when a reminder is due.',
      action: (
        <button type="button" onClick={sendTest} className={`${button} border border-slate-200 text-slate-700 hover:border-emerald-300 hover:text-emerald-700`}>
          Send a test
        </button>
      ),
    },
  }

  const state = states[permission] ?? states.unsupported
  const Icon = state.icon

  return (
    <section
      aria-label="Notification settings"
      className="mb-6 rounded-2xl border border-slate-200 bg-white p-4"
    >
      <div className="flex items-center gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${state.tone}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-900">{state.title}</p>
          <p className="text-xs text-slate-500">{state.text}</p>
        </div>
        {state.action}
      </div>

      {message && (
        <p className="mt-3 text-xs text-slate-500" role="status">
          {message}
        </p>
      )}

      <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-400">
        Notifications only work while HabitFlow is open in a browser tab. If the browser is closed
        at the due time, the reminder waits here and is marked as due the next time you open the
        app. Phone browsers generally can't show these notifications, so reminders are in-app only
        there.
      </p>
    </section>
  )
}