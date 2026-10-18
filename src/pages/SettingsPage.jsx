import { useEffect, useState } from 'react'
import { HardDrive, AlertTriangle } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import BackupSection from '../components/settings/BackupSection.jsx'

function formatBytes(bytes) {
  if (bytes == null) return 'Unknown'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function SettingsPage() {
  const [storage, setStorage] = useState({
    supported: true,
    persisted: null,
    usage: null,
  })
  const [persistMessage, setPersistMessage] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!navigator.storage) {
        setStorage({ supported: false, persisted: null, usage: null })
        return
      }
      try {
        const [persisted, estimate] = await Promise.all([
          navigator.storage.persisted?.() ?? Promise.resolve(null),
          navigator.storage.estimate?.() ?? Promise.resolve({}),
        ])
        if (!cancelled) {
          setStorage({ supported: true, persisted, usage: estimate.usage ?? null })
        }
      } catch {
        if (!cancelled) setStorage({ supported: false, persisted: null, usage: null })
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function requestPersistence() {
    setPersistMessage('')
    try {
      const granted = await navigator.storage.persist()
      setStorage((s) => ({ ...s, persisted: granted }))
      setPersistMessage(
        granted
          ? 'Done. Your browser will try to keep this data.'
          : "Your browser declined. That's common for sites you haven't used much or bookmarked. Regular backups are the safer protection.",
      )
    } catch {
      setPersistMessage("Couldn't ask the browser. Regular backups are the safer protection.")
    }
  }

  const canRequestPersistence =
    storage.supported && storage.persisted === false && Boolean(navigator.storage?.persist)

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Back up your data and see how it is stored."
      />

      <div className="space-y-6">
        <BackupSection />

        <section
          aria-labelledby="storage-title"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-4 flex items-center gap-2 text-emerald-700">
            <HardDrive className="h-5 w-5" aria-hidden="true" />
            <h2 id="storage-title" className="text-base font-semibold">
              Local storage
            </h2>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-slate-500">Protected from automatic cleanup</dt>
              <dd className="mt-0.5 text-sm font-medium text-slate-900">
                {!storage.supported
                  ? 'Not supported'
                  : storage.persisted === null
                    ? 'Unknown'
                    : storage.persisted
                      ? 'Yes'
                      : 'No (best-effort)'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Storage used by this site</dt>
              <dd className="mt-0.5 text-sm font-medium text-slate-900">
                {formatBytes(storage.usage)}
              </dd>
            </div>
          </dl>

          {canRequestPersistence && (
            <div className="mt-4">
              <button
                type="button"
                onClick={requestPersistence}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
              >
                Ask the browser to keep my data
              </button>
            </div>
          )}
          {persistMessage && (
            <p className="mt-3 text-xs text-slate-500" role="status">
              {persistMessage}
            </p>
          )}
        </section>

        <section
          className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5"
          role="note"
        >
          <AlertTriangle
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
            aria-hidden="true"
          />
          <div className="text-sm text-amber-900">
            <p className="font-medium">Your data lives only in this browser.</p>
            <p className="mt-1 text-amber-800">
              Clearing site data or cookies, using a different browser or profile, or using
              private/incognito mode can delete or hide it. It is not synced to other devices.
              Export a backup regularly.
            </p>
          </div>
        </section>
      </div>
    </>
  )
}