import { Check } from 'lucide-react'
import { format } from 'date-fns'
import { toDateKey } from '../../lib/dates.js'

export default function DayCell({ day, inMonth, today, tasks, selected, onSelect }) {
  const key = toDateKey(day)
  const isToday = key === today
  const pending = tasks.filter((t) => !t.completed)
  const done = tasks.filter((t) => t.completed)
  const allDone = tasks.length > 0 && pending.length === 0
  const overdue = key < today && pending.length > 0
  const preview = [...pending, ...done].slice(0, 2)
  const extra = tasks.length - preview.length

  const label =
    format(day, 'EEEE, d MMMM') +
    (tasks.length === 0
      ? ', no tasks'
      : `, ${pending.length} pending, ${done.length} completed`)

  return (
    <button
      type="button"
      onClick={() => onSelect(key)}
      aria-label={label}
      aria-current={isToday ? 'date' : undefined}
      className={[
        'relative flex min-h-[4.25rem] flex-col rounded-xl border p-1.5 text-left transition sm:min-h-[6.5rem] sm:p-2',
        'hover:border-emerald-300 hover:shadow-sm',
        selected ? 'border-emerald-500 ring-2 ring-emerald-200 bg-white'
          : allDone
            ? 'border-emerald-200 bg-emerald-50/70'
            : 'border-slate-100 bg-white',        inMonth ? '' : 'opacity-40',
      ].join(' ')}
    >
      <span className="flex items-start justify-between">
        <span
          className={[
            'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium sm:h-7 sm:w-7 sm:text-sm',
            isToday ? 'bg-emerald-600 text-white' : 'text-slate-700',
          ].join(' ')}
        >
          {format(day, 'd')}
        </span>
        {allDone && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white sm:h-5 sm:w-5">
            <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3" strokeWidth={3} aria-hidden="true" />
          </span>
        )}
      </span>

      {/* Desktop: task previews */}
      <span className="mt-1 hidden flex-col gap-1 sm:flex">
        {preview.map((t) => (
          <span
            key={t.id}
            className={[
              'truncate rounded-md px-1.5 py-0.5 text-[11px] leading-tight',
              t.completed
                ? 'bg-emerald-100 text-emerald-700 line-through'
                : overdue
                  ? 'bg-rose-50 text-rose-700'
                  : 'bg-slate-100 text-slate-700',
            ].join(' ')}
          >
            {t.title}
          </span>
        ))}
        {extra > 0 && <span className="px-1 text-[11px] text-slate-400">+{extra} more</span>}
      </span>

      {/* Mobile: dots */}
      <span className="mt-auto flex flex-wrap gap-0.5 sm:hidden" aria-hidden="true">
        {pending.slice(0, 3).map((t) => (
          <span
            key={t.id}
            className={`h-1.5 w-1.5 rounded-full ${overdue ? 'bg-rose-400' : 'bg-amber-400'}`}
          />
        ))}
        {done.slice(0, 3).map((t) => (
          <span key={t.id} className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        ))}
      </span>
    </button>
  )
}