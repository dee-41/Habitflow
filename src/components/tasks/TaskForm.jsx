import { useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { REMINDER_OPTIONS } from '../../lib/taskOptions.js'

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 disabled:bg-slate-50 disabled:text-slate-400'

function Field({ label, htmlFor, error, hint, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-xs font-medium text-slate-600">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      {error && (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * Shared add/edit form for tasks.
 * - Add mode (no initialValues): resets itself after a successful submit.
 * - Edit mode: parent decides what happens after onSubmit resolves.
 */
export default function TaskForm({
  initialValues = null,
  defaultDate = '',
  allowNoDate = true,
  startExpanded = false,
  submitLabel = 'Add task',
  onSubmit,
  onCancel,
}) {
  const isEdit = Boolean(initialValues)
  const titleRef = useRef(null)
  
  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [description, setDescription] = useState(initialValues?.description ?? '')
  const [dueDate, setDueDate] = useState(initialValues?.dueDate ?? defaultDate)
  const [dueTime, setDueTime] = useState(initialValues?.dueTime ?? '')
  const [reminder, setReminder] = useState(
    initialValues?.reminderOffset != null ? String(initialValues.reminderOffset) : '',
  )
  const [showDetails, setShowDetails] = useState(isEdit || startExpanded)  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [saving, setSaving] = useState(false)

  const uid = useRef(`tf-${Math.random().toString(36).slice(2, 8)}`).current

  function validate() {
    const found = {}
    if (!title.trim()) found.title = 'Please enter a title.'
    else if (title.trim().length > 120) found.title = 'Keep the title under 120 characters.'
    if (description.trim().length > 500) {
      found.description = 'Keep the description under 500 characters.'
    }
    if (!allowNoDate && !dueDate) found.dueDate = 'Please choose a date.'
    return found
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0) {
      if (found.title) titleRef.current?.focus()
      return
    }

    setSaving(true)
    setSubmitError('')
    try {
      await onSubmit({
        title,
        description,
        dueDate: dueDate || null,
        dueTime: dueDate && dueTime ? dueTime : null,
        reminderOffset: dueDate && reminder !== '' ? Number(reminder) : null,
      })
      if (!isEdit) {
        setTitle('')
        setDescription('')
        setDueTime('')
        setReminder('')
        setErrors({})
        titleRef.current?.focus()
      }
    } catch (err) {
      console.error(err)
      setSubmitError(err?.message || 'Could not save the task. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const hasDate = Boolean(dueDate)

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3">
      <Field label="Title" htmlFor={`${uid}-title`} error={errors.title}>
        <input
          ref={titleRef}
          id={`${uid}-title`}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          maxLength={140}
          className={inputClass}
          aria-invalid={Boolean(errors.title)}
        />
      </Field>

      {showDetails && (
        <>
          <Field label="Description (optional)" htmlFor={`${uid}-desc`} error={errors.description}>
            <textarea
              id={`${uid}-desc`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className={inputClass}
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Date" htmlFor={`${uid}-date`} error={errors.dueDate}>
              <input
                id={`${uid}-date`}
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Time (optional)" htmlFor={`${uid}-time`}>
              <input
                id={`${uid}-time`}
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                disabled={!hasDate}
                className={inputClass}
              />
            </Field>
          </div>

          <Field
            label="Reminder (optional)"
            htmlFor={`${uid}-reminder`}
            hint={
              hasDate && !dueTime && reminder !== ''
                ? 'No time set, so the reminder is based on 9:00 AM.'
                : undefined
            }
          >
            <select
              id={`${uid}-reminder`}
              value={reminder}
              onChange={(e) => setReminder(e.target.value)}
              disabled={!hasDate}
              className={inputClass}
            >
              {REMINDER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        </>
      )}

      {submitError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {submitError}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            Cancel
          </button>
        )}
        {!isEdit && (
          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            aria-expanded={showDetails}
            className="ml-auto rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100"
          >
            {showDetails ? 'Fewer options' : 'More options'}
          </button>
        )}
      </div>
    </form>
  )
}