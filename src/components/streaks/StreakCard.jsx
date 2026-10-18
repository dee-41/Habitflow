import { useMemo } from 'react'
import { format } from 'date-fns'
import { Flame, Trophy, Pencil, Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import StreakCalendar from './StreakCalendar.jsx'
import { calculateStreaks } from '../../lib/streaks.js'
import { getStreakColor } from '../../lib/streakColors.js'
import { fromDateKey, todayKey } from '../../lib/dates.js'
// ...
   // replaces: const today = todayKey()
function Stat({ icon: Icon, label, value, unit }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
      </div>
      <p className="mt-0.5 text-xl font-semibold text-slate-900">
        {value}
        <span className="ml-1 text-xs font-normal text-slate-400">
          {value === 1 ? unit : `${unit}s`}
        </span>
      </p>
    </div>
  )
}

const iconButton =
  'rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700'

export default function StreakCard({ streak, onToggle, onEdit, onArchive, onDelete }) {
  const today = todayKey()
  const completed = useMemo(() => new Set(streak.dates), [streak.dates])
  const stats = useMemo(() => calculateStreaks(streak.dates, today), [streak.dates, today])
  const color = getStreakColor(streak.color)
  const doneToday = completed.has(today)

  let hint = ''
  if (streak.archived) hint = 'Archived. Restore it to keep marking days.'
  else if (stats.current > 0 && !doneToday) hint = 'Mark today to keep your streak going.'

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${color.dot}`} aria-hidden="true" />
          <div className="min-w-0">
            <h2 className="break-words text-lg font-semibold text-slate-900">{streak.name}</h2>
            {streak.description && (
              <p className="mt-0.5 break-words text-sm text-slate-500">{streak.description}</p>
            )}
            <p className="mt-1 text-xs text-slate-400">
              Started {format(fromDateKey(streak.startDate), 'd MMM yyyy')}
            </p>
          </div>
        </div>

        <div className="flex shrink-0">
          <button type="button" onClick={() => onEdit(streak)} aria-label={`Edit ${streak.name}`} className={iconButton}>
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onArchive(streak)}
            aria-label={`${streak.archived ? 'Restore' : 'Archive'} ${streak.name}`}
            className={iconButton}
          >
            {streak.archived ? (
              <ArchiveRestore className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Archive className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            onClick={() => onDelete(streak)}
            aria-label={`Delete ${streak.name}`}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <Stat icon={Flame} label="Current streak" value={stats.current} unit="day" />
        <Stat icon={Trophy} label="Longest streak" value={stats.longest} unit="day" />
      </div>

      {hint && <p className={`mb-4 rounded-lg px-3 py-2 text-xs ${color.soft}`}>{hint}</p>}

      <StreakCalendar
        streak={streak}
        completed={completed}
        onToggle={onToggle}
        readOnly={streak.archived}
      />
    </article>
  )
}