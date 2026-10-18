import { useMemo, useState } from 'react'
import { addMonths, subMonths, startOfMonth, format, isSameMonth } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getMonthGrid, toDateKey, todayKey, WEEKDAY_LABELS } from '../../lib/dates.js'
import { getStreakColor } from '../../lib/streakColors.js'

const navButton =
  'flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-800'

/**
 * One streak's own monthly calendar.
 * Click a day to mark it done; click again to undo.
 */
export default function StreakCalendar({ streak, completed, onToggle, readOnly = false }) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const days = useMemo(() => getMonthGrid(month), [month])
  const today = todayKey()
  const color = getStreakColor(streak.color)

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-900" aria-live="polite">
          {format(month, 'MMMM yyyy')}
        </p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMonth((m) => subMonths(m, 1))}
            aria-label="Previous month"
            className={navButton}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setMonth(startOfMonth(new Date()))}
            disabled={isSameMonth(month, new Date())}
            className="h-8 rounded-full border border-slate-200 px-3 text-xs font-medium text-slate-600 transition hover:border-slate-300 disabled:opacity-40"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            aria-label="Next month"
            className={navButton}
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1" aria-hidden="true">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-1 text-center text-[10px] font-medium uppercase text-slate-400">
            {label.slice(0, 2)}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const key = toDateKey(day)
          if (!isSameMonth(day, month)) return <div key={key} aria-hidden="true" />

          const done = completed.has(key)
          const future = key > today
          const beforeStart = key < streak.startDate
          const disabled = readOnly || future || (beforeStart && !done)
          const isToday = key === today

          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              aria-pressed={done}
              aria-label={`${format(day, 'EEEE, d MMMM')}: ${done ? 'completed' : 'not completed'}`}
              onClick={() => onToggle(streak.id, key)}
              className={[
                'flex aspect-square items-center justify-center rounded-lg text-sm transition',
                done
                  ? `${color.solid} font-medium`
                  : disabled
                    ? 'cursor-default text-slate-300'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100',
                isToday ? `ring-2 ring-offset-1 ${color.ring}` : '',
              ].join(' ')}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}