import { useEffect, useState, useCallback } from 'react'
import { Loader2, AlertTriangle } from 'lucide-react'
import { initializeDatabase } from '../db/database.js'

/**
 * Opens IndexedDB before rendering the app.
 * Shows a loading state, and a friendly error with retry if it fails
 * (e.g. private browsing modes or blocked storage).
 */
export default function DatabaseGate({ children }) {
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'
  const [error, setError] = useState(null)

  const start = useCallback(() => {
    setStatus('loading')
    setError(null)
    initializeDatabase()
      .then(() => setStatus('ready'))
      .catch((err) => {
        console.error('Database initialization failed:', err)
        setError(err)
        setStatus('error')
      })
  }, [])

  useEffect(() => {
    start()
  }, [start])

  if (status === 'loading') {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span>Opening your data…</span>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div
          className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-sm"
          role="alert"
        >
          <div className="mb-3 flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            <h1 className="text-lg font-semibold">Couldn't open the database</h1>
          </div>
          <p className="mb-2 text-sm text-slate-600">
            HabitFlow stores your data in your browser's IndexedDB. It may be
            unavailable in private/incognito mode or if site storage is blocked.
          </p>
          {error?.message && (
            <p className="mb-4 rounded-lg bg-slate-50 p-3 font-mono text-xs text-slate-500">
              {error.message}
            </p>
          )}
          <button
            onClick={start}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return children
}