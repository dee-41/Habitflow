import { useCallback, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Flame } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import StreakCard from '../components/streaks/StreakCard.jsx'
import StreakFormModal from '../components/streaks/StreakFormModal.jsx'
import {
  getStreaksWithCompletions,
  createStreak,
  updateStreak,
  setStreakArchived,
  deleteStreak,
  toggleStreakDay,
} from '../db/streaksRepo.js'

export default function StreaksPage() {
  const streaks = useLiveQuery(getStreaksWithCompletions, [])
  const [tab, setTab] = useState('active')
  const [modal, setModal] = useState(null) // null | { streak?: object }
  const [error, setError] = useState('')

  const closeModal = useCallback(() => setModal(null), [])

  async function run(action) {
    setError('')
    try {
      await action()
    } catch (err) {
      console.error(err)
      setError(err?.message || 'Something went wrong. Please try again.')
    }
  }

  const active = streaks?.filter((s) => !s.archived) ?? []
  const archived = streaks?.filter((s) => s.archived) ?? []
  const visible = tab === 'active' ? active : archived

  function handleDelete(streak) {
    const ok = window.confirm(
      `Permanently delete "${streak.name}" and its ${streak.dates.length} completed day(s)?\n\n` +
        'This cannot be undone. Archiving keeps your history instead.',
    )
    if (ok) run(() => deleteStreak(streak.id))
  }

  const tabClass = (name) =>
    [
      'rounded-full px-4 py-1.5 text-sm font-medium transition',
      tab === name ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800',
    ].join(' ')

  return (
    <>
      <PageHeader
        title="Streaks"
        subtitle="Build habits one day at a time. Each streak has its own calendar."
        action={
          <button
            type="button"
            onClick={() => setModal({})}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New streak
          </button>
        }
      />

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <div className="mb-6 inline-flex rounded-full bg-slate-100 p-1" role="group" aria-label="Streak filter">
        <button type="button" onClick={() => setTab('active')} aria-pressed={tab === 'active'} className={tabClass('active')}>
          Active ({active.length})
        </button>
        <button type="button" onClick={() => setTab('archived')} aria-pressed={tab === 'archived'} className={tabClass('archived')}>
          Archived ({archived.length})
        </button>
      </div>

      {streaks === undefined && <p className="text-sm text-slate-400">Loading…</p>}

      {streaks && visible.length === 0 && (
        <div className="flex flex-col items-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Flame className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-medium text-slate-900">
            {tab === 'active' ? 'No streaks yet' : 'Nothing archived'}
          </h2>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            {tab === 'active'
              ? 'Create one for anything you want to do every day: LeetCode, studying, reading, exercise.'
              : 'Archived streaks keep their full history and show up here.'}
          </p>
          {tab === 'active' && (
            <button
              type="button"
              onClick={() => setModal({})}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create your first streak
            </button>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {visible.map((streak) => (
          <StreakCard
            key={streak.id}
            streak={streak}
            onToggle={(id, dateKey) => run(() => toggleStreakDay(id, dateKey))}
            onEdit={(s) => setModal({ streak: s })}
            onArchive={(s) => run(() => setStreakArchived(s.id, !s.archived))}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {modal && (
        <StreakFormModal
          initialValues={modal.streak ?? null}
          onSubmit={(values) =>
            modal.streak ? updateStreak(modal.streak.id, values) : createStreak(values)
          }
          onClose={closeModal}
        />
      )}
    </>
  )
}