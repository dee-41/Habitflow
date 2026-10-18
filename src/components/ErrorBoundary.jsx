import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'

/** Catches render errors so a bug shows a recovery screen, not a blank page. */
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Unexpected error:', error, info?.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div
          className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-sm"
          role="alert"
        >
          <div className="mb-3 flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            <h1 className="text-lg font-semibold">Something went wrong</h1>
          </div>
          <p className="mb-2 text-sm text-slate-600">
            HabitFlow hit an unexpected error. Your saved data is stored separately and was not
            changed.
          </p>
          {this.state.error?.message && (
            <p className="mb-4 break-words rounded-lg bg-slate-50 p-3 font-mono text-xs text-slate-500">
              {this.state.error.message}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              Reload
            </button>
            <a
              href="/"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              Go to calendar
            </a>
          </div>
        </div>
      </div>
    )
  }
}