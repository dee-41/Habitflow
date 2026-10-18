import { useCallback, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { format, formatDistance } from 'date-fns'
import { AlertTriangle, CheckCircle2, Download, Loader2, Upload } from 'lucide-react'
import ImportConfirmModal from './ImportConfirmModal.jsx'
import {
  MAX_IMPORT_BYTES,
  describeSummary,
  exportAllData,
  getDataSummary,
  getLastBackupAt,
  importBackup,
  markExported,
  parseBackup,
  summarize,
} from '../../db/backup.js'
import { downloadJson } from '../../lib/download.js'
import { formatTimestamp } from '../../lib/dates.js'
import { useNow } from '../../hooks/useNow.js'

const STALE_AFTER_MS = 14 * 24 * 60 * 60 * 1000

/** Generates the backup, downloads it, and records the export time. */
async function exportToFile() {
  const backup = await exportAllData()
  downloadJson(`habitflow-backup-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`, backup)
  await markExported()
  return backup.summary
}

export default function BackupSection() {
  const lastBackupAt = useLiveQuery(getLastBackupAt, [])
  const current = useLiveQuery(getDataSummary, [])
  const now = useNow(60_000)
  const fileInputRef = useRef(null)

  const [exporting, setExporting] = useState(false)
  const [pending, setPending] = useState(null)
  const [message, setMessage] = useState(null) // { type: 'success' | 'error', text }

  const hasData = current
    ? current.tasks + current.reminders + current.streaks + current.streakDays > 0
    : false
  const stale =
    lastBackupAt !== undefined &&
    hasData &&
    (lastBackupAt === null || now - lastBackupAt > STALE_AFTER_MS)

  async function handleExport() {
    setExporting(true)
    setMessage(null)
    try {
      const summary = await exportToFile()
      setMessage({
        type: 'success',
        text: `Exported ${describeSummary(summary)}. Keep the file somewhere safe, such as cloud storage or another drive.`,
      })
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: err?.message || 'The export failed. Please try again.' })
    } finally {
      setExporting(false)
    }
  }

  async function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow choosing the same file again later
    if (!file) return

    setMessage(null)
    if (file.size > MAX_IMPORT_BYTES) {
      setMessage({ type: 'error', text: 'That file is too large to be a HabitFlow backup.' })
      return
    }
    try {
      const text = await file.text()
      const { data, exportedAt } = parseBackup(text)
      setPending({ fileName: file.name, data, exportedAt, summary: summarize(data) })
    } catch (err) {
      console.error(err)
      setMessage({
        type: 'error',
        text: `${err?.message || 'Could not read that file.'} Nothing was changed.`,
      })
    }
  }

  async function handleConfirmImport() {
    await importBackup(pending.data) // throws on failure; the modal shows it
    setMessage({
      type: 'success',
      text: `Restored ${describeSummary(pending.summary)} from ${pending.fileName}.`,
    })
    setPending(null)
  }

  const closeModal = useCallback(() => setPending(null), [])

  return (
    <section
      aria-labelledby="backup-title"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="mb-1 flex items-center gap-2 text-emerald-700">
        <Download className="h-5 w-5" aria-hidden="true" />
        <h2 id="backup-title" className="text-base font-semibold">
          Backup and restore
        </h2>
      </div>
      <p className="mb-4 text-sm text-slate-500">
        Save all your tasks, reminders and streaks to a file, and restore them later or on another
        browser or computer.
      </p>

      {lastBackupAt !== undefined && (
        <p
          className={[
            'mb-4 flex items-start gap-2 rounded-lg px-3 py-2 text-sm',
            stale ? 'bg-amber-50 text-amber-900' : 'bg-slate-50 text-slate-600',
          ].join(' ')}
        >
          {stale && (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
          )}
          <span>
            {lastBackupAt
              ? `Last export: ${formatTimestamp(lastBackupAt)} (${formatDistance(lastBackupAt, now, { addSuffix: true })}).`
              : "You haven't exported a backup yet."}
            {stale && ' Consider exporting a fresh one.'}
          </span>
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="h-4 w-4" aria-hidden="true" />
          )}
          Export backup
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
        >
          <Upload className="h-4 w-4" aria-hidden="true" />
          Import backup…
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFile}
          className="hidden"
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>

      {message && (
        <p
          role={message.type === 'error' ? 'alert' : 'status'}
          className={[
            'mt-4 flex items-start gap-2 rounded-lg px-3 py-2 text-sm',
            message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800',
          ].join(' ')}
        >
          {message.type === 'success' && (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          <span>{message.text}</span>
        </p>
      )}

      <p className="mt-4 text-xs text-slate-400">
        Importing replaces everything stored in this browser, and the file is checked before
        anything is changed. This is a manual copy, not syncing: two browsers stay independent
        after you import.
      </p>

      {pending && (
        <ImportConfirmModal
          pending={pending}
          onBackupFirst={exportToFile}
          onConfirm={handleConfirmImport}
          onClose={closeModal}
        />
      )}
    </section>
  )
}