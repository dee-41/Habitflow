import { useCallback, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Bell } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import NotificationBanner from '../components/reminders/NotificationBanner.jsx'
import ReminderItem from '../components/reminders/ReminderItem.jsx'
import ReminderFormModal from '../components/reminders/ReminderFormModal.jsx'
import {
  getAllReminders,
  createReminder,
  updateReminder,
  setReminderStatus,
  deleteReminder,
} from '../db/remindersRepo.js'
import { useNow } from '../hooks/useNow.js'
import { getReminderBucket } from '../lib/reminders.js'

export default function RemindersPage() {
  const reminders = useLiveQuery(getAllReminders, [])
  const now = useNow()
  const [tab, setTab] = useState('upcoming')
  const [modal, setModal] = useState(null) // null | { reminder?: object }
  const [error, setError] = useState('')

  const closeModal = useCallback(() => setModal(null), [])

  const { due, upcoming, past } = useMemo(() => {
    const result = { due: [], upcoming: [], past: [] }
    for (const r of reminders ?? []) result[getReminderBucket(r, now)].push(r)
    result.due.sort((a, b) => a.remindAt - b.remindAt)
    result.upcoming.sort((a, b) => a.remindAt - b.remindAt)
    result.past.sort((a, b) => b.remindAt - a.remindAt)
    return result
  }, [reminders, now])

  async function run(action) {
    setError('')
    try {
      await action()
    } catch (err) {
      console.error(err)
      setError(err?.message || 'Something went wrong. Please try again.')
    }
  }

  function handleDelete(reminder) {
    if (window.confirm(`Delete "${reminder.title}"? This can't be undone.`)) {
      run(() => deleteReminder(reminder.id))
    }
  }

  function renderItem(reminder, bucket) {
    return (
      <ReminderItem
        key={reminder.id}
        reminder={reminder}
        bucket={bucket}
        onComplete={(r) => run(() => setReminderStatus(r.id, 'completed'))}
        onDismiss={(r) => run(() => setReminderStatus(r.id, 'dismissed'))}
        onRestore={(r) => run(() => setReminderStatus(r.id, 'pending'))}
        onEdit={(r) => setModal({ reminder: r })}
        onDelete={handleDelete}
      />
    )
  }

  const activeCount = due.length + upcoming.length
  const tabClass = (name) =>
    [
      'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition',
      tab === name ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800',
    ].join(' ')

  const empty =
    tab === 'upcoming'
      ? {
          title: 'No upcoming reminders',
          text: "Create one here, or choose a reminder when you set a task's date and time.",
        }
      : {
          title: 'No past reminders',
          text: 'Completed and dismissed reminders will show up here.',
        }

  return (
    <>
      <PageHeader
        title="Reminders"
        subtitle="Never miss what matters."
        action={
          <button
            type="button"
            onClick={() => setModal({})}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New reminder
          </button>
        }
      />

      <NotificationBanner />

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <div className="mb-6 inline-flex rounded-full bg-slate-100 p-1" role="group" aria-label="Reminder filter">
        <button type="button" onClick={() => setTab('upcoming')} aria-pressed={tab === 'upcoming'} className={tabClass('upcoming')}>
          Upcoming
          <span className={`text-xs ${due.length > 0 ? 'text-rose-500' : 'text-slate-400'}`}>{activeCount}</span>
        </button>
        <button type="button" onClick={() => setTab('past')} aria-pressed={tab === 'past'} className={tabClass('past')}>
          Past
          <span className="text-xs text-slate-400">{past.length}</span>
        </button>
      </div>

      {reminders === undefined && <p className="text-sm text-slate-400">Loading…</p>}

      {reminders && tab === 'upcoming' && activeCount > 0 && (
        <div className="space-y-8">
          {due.length > 0 && (
            <section aria-labelledby="rem-due">
              <h2 id="rem-due" className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-600">
                Due now · {due.length}
              </h2>
              <ul className="space-y-2">{due.map((r) => renderItem(r, 'due'))}</ul>
            </section>
          )}
          {upcoming.length > 0 && (
            <section aria-labelledby="rem-upcoming">
              <h2 id="rem-upcoming" className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Upcoming · {upcoming.length}
              </h2>
              <ul className="space-y-2">{upcoming.map((r) => renderItem(r, 'upcoming'))}</ul>
            </section>
          )}
        </div>
      )}

      {reminders && tab === 'past' && past.length > 0 && (
        <ul className="space-y-2">{past.map((r) => renderItem(r, 'past'))}</ul>
      )}

      {reminders && ((tab === 'upcoming' && activeCount === 0) || (tab === 'past' && past.length === 0)) && (
        <div className="flex flex-col items-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Bell className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-medium text-slate-900">{empty.title}</h2>
          <p className="mt-1 max-w-sm text-sm text-slate-500">{empty.text}</p>
        </div>
      )}

      {modal && (
        <ReminderFormModal
          initialValues={modal.reminder ?? null}
          onSubmit={(values) =>
            modal.reminder ? updateReminder(modal.reminder.id, values) : createReminder(values)
          }
          onClose={closeModal}
        />
      )}
    </>
  )
}