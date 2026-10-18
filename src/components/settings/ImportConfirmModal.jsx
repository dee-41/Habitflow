import { useEffect, useId, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { AlertTriangle, Download, Loader2, X } from 'lucide-react'
import { describeSummary, getDataSummary } from '../../db/backup.js'
import { formatTimestamp } from '../../lib/dates.js'

export default function ImportConfirmModal({ pending, onBackupFirst, onConfirm, onClose }) {
  const uid = useId()
  const dialogRef = useRef(null)
  const current = useLiveQuery(getDataSummary, [])
  const [busy, setBusy] = useState(null) // null | 'backup' | 'import'
  const [backedUp, setBackedUp] = useState(false)
  const [error, setError] = useState('')

  // Move focus into the dialog; give it back to the opener on close.
  useEffect(() => {
    const opener = document.activeElement
    dialogRef.current?.focus()
    return () => {
      if (opener instanceof HTMLElement) opener.focus()
    }
  }, [])

  async function handleBackupFirst() {
    setBusy('backup')
    setError('')
    try {
      await onBackupFirst()
      setBackedUp(true)
    } catch (err) {
      console.error(err)
      setError(err?.message || 'Could not export your current data.')
    } finally {
      setBusy(null)
    }
  }

  async function handleConfirm() {
    setBusy('import')
    setError('')
    try {
      await onConfirm() // the parent closes this dialog on success
    } catch (err) {
      console.error(err)
      setError(
        (err?.message || 'The import failed.') +
          ' Your existing data was not changed.',
      )
      setBusy(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/40 sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose()
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && !busy) onClose()
        }}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl outline-none sm:rounded-3xl sm:p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id={`${uid}-title`} className="text-lg font-semibold text-slate-900">
            Replace your data with this backup?
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={Boolean(busy)}
            aria-label="Close"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <dl className="space-y-3 text-sm">
          <div className="rounded-xl bg-emerald-50 p-3">
            <dt className="text-xs font-medium text-emerald-700">
              In the file ({pending.fileName})
              {pending.exportedAt ? ` · exported ${formatTimestamp(pending.exportedAt)}` : ''}
            </dt>
            <dd className="mt-0.5 text-slate-900">{describeSummary(pending.summary)}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <dt className="text-xs font-medium text-slate-500">Currently in this browser</dt>
            <dd className="mt-0.5 text-slate-900">
              {current ? describeSummary(current) : 'Loading…'}
            </dd>
          </div>
        </dl>

        <div className="mt-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
          <p>
            Importing <strong>replaces</strong> everything currently stored here. Anything not in
            the file will be gone.
          </p>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={handleBackupFirst}
            disabled={Boolean(busy)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-60"
          >
            {busy === 'backup' ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="h-4 w-4" aria-hidden="true" />
            )}
            {backedUp ? 'Downloaded. Download again' : 'Download current data first'}
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={Boolean(busy)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700 disabled:opacity-60"
          >
            {busy === 'import' && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            Replace my data
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={Boolean(busy)}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}