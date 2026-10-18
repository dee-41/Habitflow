import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Search, ListChecks, X } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import TaskForm from '../components/tasks/TaskForm.jsx'
import TaskItem from '../components/tasks/TaskItem.jsx'
import {
  getAllTasks,
  createTask,
  updateTask,
  setTaskCompleted,
  deleteTask,
} from '../db/tasksRepo.js'
import { useToday } from '../hooks/useToday.js'
import {
  FILTERS,
  getBucket,
  inFilter,
  matchesSearch,
  sortTasks,
} from '../lib/taskFilters.js'

const GROUPS = [
  { id: 'overdue', label: 'Overdue', tone: 'text-rose-600' },
  { id: 'today', label: 'Today', tone: 'text-emerald-600' },
  { id: 'upcoming', label: 'Upcoming', tone: 'text-slate-400' },
  { id: 'general', label: 'No date', tone: 'text-slate-400' },
]

export default function TasksPage() {
  const tasks = useLiveQuery(getAllTasks, [])
  const [filter, setFilter] = useState('pending')
  const [query, setQuery] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')

  const today = useToday()

  const counts = useMemo(() => {
    const result = {}
    for (const f of FILTERS) {
      result[f.id] = (tasks ?? []).filter((t) => inFilter(t, f.id, today)).length
    }
    return result
  }, [tasks, today])

  const visible = useMemo(() => {
    const list = (tasks ?? []).filter(
      (t) => inFilter(t, filter, today) && matchesSearch(t, query),
    )
    return sortTasks(list, filter)
  }, [tasks, filter, query, today])

  async function run(action) {
    setError('')
    try {
      await action()
    } catch (err) {
      console.error(err)
      setError(err?.message || 'Something went wrong. Please try again.')
    }
  }

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
        showDate
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

  const tabClass = (active) =>
    [
      'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition',
      active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800',
    ].join(' ')

  const hasAnyTasks = (tasks?.length ?? 0) > 0

  return (
    <>
      <PageHeader
        title="Tasks"
        subtitle="Everything you need to do, with or without a date."
        action={
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            aria-expanded={adding}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New task
          </button>
        }
      />

      {adding && (
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <TaskForm
            startExpanded
            onSubmit={(values) => createTask(values)}
            onCancel={() => setAdding(false)}
          />
          <p className="mt-3 text-xs text-slate-400">
            Leave the date empty to add a general task. You can keep adding tasks, then press Cancel to close.
          </p>
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="-mx-1 flex max-w-full overflow-x-auto rounded-full bg-slate-100 p-1"
          role="group"
          aria-label="Task filter"
        >
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={tabClass(filter === f.id)}
            >
              {f.label}
              <span
                className={[
                  'text-xs',
                  f.id === 'overdue' && counts.overdue > 0 ? 'text-rose-500' : 'text-slate-400',
                ].join(' ')}
              >
                {counts[f.id]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative sm:w-64">
          <label htmlFor="task-search" className="sr-only">
            Search tasks
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="task-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks"
            className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-9 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-700"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {tasks === undefined && <p className="text-sm text-slate-400">Loading…</p>}

      {tasks && visible.length === 0 && (
        <div className="flex flex-col items-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <ListChecks className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-medium text-slate-900">
            {query
              ? 'No matching tasks'
              : !hasAnyTasks
                ? 'No tasks yet'
                : 'Nothing here'}
          </h2>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            {query
              ? 'Try a different search, or switch filters.'
              : !hasAnyTasks
                ? 'Add a general task, or click a date on the calendar to plan your day.'
                : 'No tasks in this view.'}
          </p>
        </div>
      )}

      {tasks && visible.length > 0 && filter === 'pending' && (
        <div className="space-y-8">
          {GROUPS.map((group) => {
            const items = visible.filter((t) => getBucket(t, today) === group.id)
            if (items.length === 0) return null
            return (
              <section key={group.id} aria-labelledby={`group-${group.id}`}>
                <h2
                  id={`group-${group.id}`}
                  className={`mb-2 text-xs font-semibold uppercase tracking-wide ${group.tone}`}
                >
                  {group.label} · {items.length}
                </h2>
                <ul className="space-y-2">{items.map(renderTask)}</ul>
              </section>
            )
          })}
        </div>
      )}

      {tasks && visible.length > 0 && filter !== 'pending' && (
        <ul className="space-y-2">{visible.map(renderTask)}</ul>
      )}
    </>
  )
}