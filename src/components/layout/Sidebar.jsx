import { NavLink } from 'react-router-dom'
import { CheckCheck } from 'lucide-react'
import { NAV_ITEMS } from '../../navigation.js'

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
      <div className="flex items-center gap-2 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
          <CheckCheck className="h-5 w-5" aria-hidden="true" />
        </div>
        <span className="text-lg font-semibold tracking-tight text-slate-900">
          HabitFlow
        </span>
      </div>

      <nav aria-label="Main" className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              ].join(' ')
            }
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>

      <p className="px-6 py-5 text-xs text-slate-400">
        Your data is stored locally in this browser.
      </p>
    </aside>
  )
}