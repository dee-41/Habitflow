import { Check, Pencil, Trash2, Clock, Bell, CalendarDays } from 'lucide-react'
import { formatTime, fromDateKey } from '../../lib/dates.js'
import { format } from 'date-fns'

export default function TaskItem({ task, onToggle, onEdit, onDelete, showDate = false }) {
  return (
    <li className="group flex items-start gap-3 rounded-xl border border-slate-100 bg-white px-3 py-3 transition hover:border-slate-200">
      <button
        type="button"
        role="checkbox"
        aria-checked={task.completed}
        aria-label={`${task.completed ? 'Mark as not done' : 'Mark as done'}: ${task.title}`}
        onClick={() => onToggle(task)}
        className={[
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition',
          task.completed
            ? 'border-emerald-500 bg-emerald-500 text-white'
            : 'border-slate-300 text-transparent hover:border-emerald-400',
        ].join(' ')}
      >
        <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={[
            'break-words text-sm font-medium',
            task.completed ? 'text-slate-400 line-through' : 'text-slate-900',
          ].join(' ')}
        >
          {task.title}
        </p>
        {task.description && (
          <p className="mt-0.5 whitespace-pre-line break-words text-xs text-slate-500">
            {task.description}
          </p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
          {showDate && task.dueDate && (
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3 w-3" aria-hidden="true" />
              {format(fromDateKey(task.dueDate), 'd MMM yyyy')}
            </span>
          )}
          {task.dueTime && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {formatTime(task.dueTime)}
            </span>
          )}
          {task.reminderOffset != null && (
            <span className="inline-flex items-center gap-1">
              <Bell className="h-3 w-3" aria-hidden="true" />
              Reminder
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 gap-1 opacity-100 transition sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
        <button
          type="button"
          onClick={() => onEdit(task)}
          aria-label={`Edit ${task.title}`}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(task)}
          aria-label={`Delete ${task.title}`}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </li>
  )
}