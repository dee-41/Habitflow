import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { addMonths, subMonths, startOfMonth, format, isSameMonth } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import DayCell from '../components/calendar/DayCell.jsx'
import DayPanel from '../components/calendar/DayPanel.jsx'
import { getTasksInRange } from '../db/tasksRepo.js'
import { getMonthGrid, toDateKey, todayKey, WEEKDAY_LABELS } from '../lib/dates.js'


const navButton =
  'flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700'

export default function CalendarPage() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [selected, setSelected] = useState(null)

  const days = useMemo(() => getMonthGrid(month), [month])
  const startKey = toDateKey(days[0])
  const endKey = toDateKey(days[days.length - 1])

  // Live: updates automatically when tasks change in the panel.
  const tasks = useLiveQuery(() => getTasksInRange(startKey, endKey), [startKey, endKey])

  const tasksByDate = useMemo(() => {
    const map = new Map()
    for (const task of tasks ?? []) {
      if (!map.has(task.dueDate)) map.set(task.dueDate, [])
      map.get(task.dueDate).push(task)
    }
    return map
  }, [tasks])

  const today = todayKey()
  const viewingCurrentMonth = isSameMonth(month, new Date())

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Your planner</p>
          <h1
            className="text-3xl font-semibold tracking-tight text-slate-900"
            aria-live="polite"
          >
            {format(month, 'MMMM')}{' '}
            <span className="font-normal text-slate-400">{format(month, 'yyyy')}</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMonth((m) => subMonths(m, 1))}
            aria-label="Previous month"
            className={navButton}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setMonth(startOfMonth(new Date()))}
            disabled={viewingCurrentMonth}
            className="h-10 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-default disabled:opacity-50 disabled:hover:border-slate-200 disabled:hover:text-slate-700"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            aria-label="Next month"
            className={navButton}
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm sm:p-5">
        <div className="mb-2 grid grid-cols-7 gap-1 sm:gap-2" aria-hidden="true">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="py-1 text-center text-[11px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {days.map((day) => {
            const key = toDateKey(day)
            return (
              <DayCell
                key={key}
                day={day}
                inMonth={isSameMonth(day, month)}
                today={today}
                tasks={tasksByDate.get(key) ?? []}
                selected={key === selected}
                onSelect={setSelected}
              />
            )
          })}
        </div>
      </div>

      <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-slate-500">
        <li className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-400" /> Pending
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-rose-400" /> Overdue
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Completed
        </li>
      </ul>

      {selected && <DayPanel dateKey={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}