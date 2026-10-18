import { useEffect, useId, useRef, useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { STREAK_COLORS } from '../../lib/streakColors.js'
import { todayKey } from '../../lib/dates.js'

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500'

export default function StreakFormModal({ initialValues = null, onSubmit, onClose }) {
  const isEdit = Boolean(initialValues)
  const uid = useId()
  const nameRef = useRef(null)

  const [name, setName] = useState(initialValues?.name ?? '')
  const [description, setDescription] = useState(initialValues?.description ?? '')
  const [startDate, setStartDate] = useState(initialValues?.startDate ?? todayKey())
  const [color, setColor] = useState(initialValues?.color ?? 'emerald')
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSubmit(e) {
    e.preventDefault()
    const found = {}
    if (!name.trim()) found.name = 'Please enter a name.'
    else if (name.trim().length > 60) found.name = 'Keep the name under 60 characters.'
    if (description.trim().length > 200) found.description = 'Keep it under 200 characters.'
    if (!startDate) found.startDate = 'Please choose a start date.'
    setErrors(found)
    if (Object.keys(found).length > 0) {
      if (found.name) nameRef.current?.focus()
      return
    }

    setSaving(true)
    setSubmitError('')
    try {
      await onSubmit({ name, description, startDate, color })
      onClose()
    } catch (err) {
      console.error(err)
      setSubmitError(err?.message || 'Could not save the streak. Please try again.')
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
            {isEdit ? 'Edit streak' : 'New streak'}
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
            <label htmlFor={`${uid}-name`} className="mb-1 block text-xs font-medium text-slate-600">
              Name
            </label>
            <input
              ref={nameRef}
              id={`${uid}-name`}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. LeetCode, Reading, Exercise"
              maxLength={80}
              className={inputClass}
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600" role="alert">
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor={`${uid}-desc`} className="mb-1 block text-xs font-medium text-slate-600">
              Description (optional)
            </label>
            <textarea
              id={`${uid}-desc`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className={inputClass}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600" role="alert">
                {errors.description}
              </p>
            )}
          </div>

          <div>
            <label htmlFor={`${uid}-start`} className="mb-1 block text-xs font-medium text-slate-600">
              Start date
            </label>
            <input
              id={`${uid}-start`}
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputClass}
            />
            {errors.startDate && (
              <p className="mt-1 text-xs text-red-600" role="alert">
                {errors.startDate}
              </p>
            )}
          </div>

          <div>
            <p id={`${uid}-color`} className="mb-2 text-xs font-medium text-slate-600">
              Color
            </p>
            <div role="radiogroup" aria-labelledby={`${uid}-color`} className="flex flex-wrap gap-2">
              {Object.entries(STREAK_COLORS).map(([key, c]) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={color === key}
                  aria-label={c.label}
                  onClick={() => setColor(key)}
                  className={[
                    'h-8 w-8 rounded-full transition',
                    c.dot,
                    color === key
                      ? 'ring-2 ring-slate-900 ring-offset-2'
                      : 'hover:scale-110',
                  ].join(' ')}
                />
              ))}
            </div>
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
              {isEdit ? 'Save changes' : 'Create streak'}
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