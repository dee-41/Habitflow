import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { X, CalendarCheck } from 'lucide-react'
import TaskForm from '../tasks/TaskForm.jsx'
import TaskItem from '../tasks/TaskItem.jsx'
import {
  getTasksForDate,
  createTask,
  updateTask,
  setTaskCompleted,
  deleteTask,
} from '../../db/tasksRepo.js'
import { formatLongDate, fromDateKey } from '../../lib/dates.js'

export default function DayPanel({ dateKey, onClose }) {
  const tasks = useLiveQuery(() => getTasksForDate(dateKey), [dateKey])
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const panelRef = useRef(null)

  // Close on Escape, lock page scroll, move focus into the dialog.
  useEffect(() => {
    const opener = document.activeElement
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
      if (opener instanceof HTMLElement) opener.focus()
    }
  }, [onClose])

  async function run(action) {
    setError('')
    try {
      await action()
    } catch (err) {
      console.error(err)
      setError(err?.message || 'Something went wrong. Please try again.')
    }
  }

  const pending = tasks?.filter((t) => !t.completed) ?? []
  const completed = tasks?.filter((t) => t.completed) ?? []

  function renderTask(task) {
    if (task.id === editingId) {
      return (
        <li key={task.id} className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
          <TaskForm
            initialValues={task}
            submitLabel="Save changes"
            onSubmit={async (values) => {
              await updateTask(task.id, values)
              setEditingId(null)
            }}
            onCancel={() => setEditingId(null)}
          />
        </li>
      )
    }
    return (
      <TaskItem
        key={task.id}
        task={task}
        onToggle={(t) => run(() => setTaskCompleted(t.id, !t.completed))}
        onEdit={(t) => setEditingId(t.id)}
        onDelete={(t) => {
          if (window.confirm(`Delete "${t.title}"? This can't be undone.`)) {
            run(() => deleteTask(t.id))
          }
        }}
      />
    )
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/40 sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="day-panel-title"
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl outline-none sm:rounded-3xl sm:p-6"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="day-panel-title" className="text-lg font-semibold text-slate-900">
              {formatLongDate(fromDateKey(dateKey))}
            </h2>
            {tasks && (
              <p className="mt-0.5 text-sm text-slate-500">
                {tasks.length === 0
                  ? 'Nothing planned yet'
                  : `${completed.length} of ${tasks.length} completed`}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <TaskForm
          defaultDate={dateKey}
          allowNoDate={false}
          onSubmit={(values) => createTask(values)}
        />

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <div className="mt-6 space-y-6">
          {tasks === undefined && <p className="text-sm text-slate-400">Loading…</p>}

          {tasks && tasks.length === 0 && (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 py-8 text-center">
              <CalendarCheck className="mb-2 h-8 w-8 text-slate-300" aria-hidden="true" />
              <p className="text-sm text-slate-500">No tasks for this day.</p>
            </div>
          )}

          {pending.length > 0 && (
            <section aria-labelledby="pending-title">
              <h3 id="pending-title" className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                To do
              </h3>
              <ul className="space-y-2">{pending.map(renderTask)}</ul>
            </section>
          )}

          {completed.length > 0 && (
            <section aria-labelledby="done-title">
              <h3 id="done-title" className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                Completed
              </h3>
              <ul className="space-y-2">{completed.map(renderTask)}</ul>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}