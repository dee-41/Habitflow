import { useEffect, useId, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { addHours, format, startOfHour } from 'date-fns'
import { X, Loader2 } from 'lucide-react'
import { getTasksForPicker } from '../../db/remindersRepo.js'
import { dateTimeToMs, fromDateKey, toDateKey } from '../../lib/dates.js'

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500'

function toFormState(reminder) {
  if (reminder) {
    const d = new Date(reminder.remindAt)
    return {
      title: reminder.title,
      date: toDateKey(d),
      time: format(d, 'HH:mm'),
      taskId: reminder.taskId ?? '',
    }
  }
  // Default: the start of the next hour (handles crossing midnight).
  const d = addHours(startOfHour(new Date()), 1)
  return { title: '', date: toDateKey(d), time: format(d, 'HH:mm'), taskId: '' }
}

function FieldError({ message }) {
  if (!message) return null
  return (
    <p className="mt-1 text-xs text-red-600" role="alert">
      {message}
    </p>
  )
}

export default function ReminderFormModal({ initialValues = null, onSubmit, onClose }) {
  const isEdit = Boolean(initialValues)
  const uid = useId()
  const titleRef = useRef(null)

  const [form, setForm] = useState(() => toFormState(initialValues))
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [saving, setSaving] = useState(false)

  const tasks = useLiveQuery(
    () => getTasksForPicker(initialValues?.taskId),
    [initialValues?.taskId],
  )

  // Focus the title, close on Escape, and give focus back when closed.
  useEffect(() => {
    const opener = document.activeElement
    titleRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (opener instanceof HTMLElement) opener.focus()
    }
  }, [onClose])

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  function handleTaskChange(e) {
    const taskId = e.target.value
    const task = tasks?.find((t) => t.id === taskId)
    setForm((f) => ({
      ...f,
      taskId,
      // Convenience: use the task's title if the title is still empty.
      title: !f.title.trim() && task ? task.title : f.title,
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const found = {}
    if (!form.title.trim()) found.title = 'Please enter a title.'
    else if (form.title.trim().length > 120) found.title = 'Keep the title under 120 characters.'
    if (!form.date) found.date = 'Please choose a date.'
    if (!form.time) found.time = 'Please choose a time.'

    if (!found.date && !found.time) {
      const ms = dateTimeToMs(form.date, form.time)
      const unchanged = isEdit && ms === initialValues.remindAt
      if (!unchanged && ms <= Date.now()) found.time = 'Choose a time in the future.'
    }

    setErrors(found)
    if (Object.keys(found).length > 0) {
      if (found.title) titleRef.current?.focus()
      return
    }

    setSaving(true)
    setSubmitError('')
    try {
      await onSubmit({
        title: form.title,
        date: form.date,
        time: form.time,
        taskId: form.taskId || null,
      })
      onClose()
    } catch (err) {
      console.error(err)
      setSubmitError(err?.message || 'Could not save the reminder. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/40 sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-heading`}
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl sm:p-6"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 id={`${uid}-heading`} className="text-lg font-semibold text-slate-900">
            {isEdit ? 'Edit reminder' : 'New reminder'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor={`${uid}-title`} className="mb-1 block text-xs font-medium text-slate-600">
              Title
            </label>
            <input
              ref={titleRef}
              id={`${uid}-title`}
              type="text"
              value={form.title}
              onChange={setField('title')}
              placeholder="What should I remind you about?"
              maxLength={140}
              className={inputClass}
              aria-invalid={Boolean(errors.title)}
            />
            <FieldError message={errors.title} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={`${uid}-date`} className="mb-1 block text-xs font-medium text-slate-600">
                Date
              </label>
              <input
                id={`${uid}-date`}
                type="date"
                value={form.date}
                onChange={setField('date')}
                className={inputClass}
                aria-invalid={Boolean(errors.date)}
              />
              <FieldError message={errors.date} />
            </div>
            <div>
              <label htmlFor={`${uid}-time`} className="mb-1 block text-xs font-medium text-slate-600">
                Time
              </label>
              <input
                id={`${uid}-time`}
                type="time"
                value={form.time}
                onChange={setField('time')}
                className={inputClass}
                aria-invalid={Boolean(errors.time)}
              />
              <FieldError message={errors.time} />
            </div>
          </div>

          <div>
            <label htmlFor={`${uid}-task`} className="mb-1 block text-xs font-medium text-slate-600">
              Linked task (optional)
            </label>
            <select
              id={`${uid}-task`}
              value={form.taskId}
              onChange={handleTaskChange}
              className={inputClass}
            >
              <option value="">No linked task</option>
              {(tasks ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                  {t.dueDate ? ` · ${format(fromDateKey(t.dueDate), 'd MMM')}` : ''}
                </option>
              ))}
            </select>
          </div>

          {submitError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {submitError}
            </p>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {isEdit ? 'Save changes' : 'Create reminder'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}