import { Bell, BellOff, Check, ListChecks, Pencil, Trash2, Undo2 } from 'lucide-react'
import { formatReminderTime } from '../../lib/reminders.js'

const iconButton =
  'rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700'

export default function ReminderItem({
  reminder,
  bucket,
  onComplete,
  onDismiss,
  onRestore,
  onEdit,
  onDelete,
}) {
  const isPast = bucket === 'past'
  const isDue = bucket === 'due'
  const completed = reminder.status === 'completed'
  const dismissed = reminder.status === 'dismissed'

  const badgeTone = completed
    ? 'bg-emerald-100 text-emerald-600'
    : isDue
      ? 'bg-rose-100 text-rose-600'
      : dismissed
        ? 'bg-slate-100 text-slate-400'
        : 'bg-emerald-50 text-emerald-600'
  const BadgeIcon = dismissed ? BellOff : completed ? Check : Bell

  return (
    <li
      className={[
        'flex items-start gap-3 rounded-xl border px-3 py-3 transition',
        isDue ? 'border-rose-200 bg-rose-50/50' : 'border-slate-100 bg-white hover:border-slate-200',
      ].join(' ')}
    >
      <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${badgeTone}`}>
        <BadgeIcon className="h-4 w-4" aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <p
          className={[
            'break-words text-sm font-medium',
            completed ? 'text-slate-400 line-through' : dismissed ? 'text-slate-500' : 'text-slate-900',
          ].join(' ')}
        >
          {reminder.title}
        </p>

        <p className={`mt-0.5 text-xs ${isDue ? 'font-medium text-rose-600' : 'text-slate-500'}`}>
          {isDue && 'Due · '}
          {isPast && `${completed ? 'Completed' : 'Dismissed'} · `}
          {formatReminderTime(reminder.remindAt)}
        </p>

        {reminder.task && (
          <p className="mt-1.5 inline-flex max-w-full items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">
            <ListChecks className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className={`truncate ${reminder.task.completed ? 'line-through' : ''}`}>
              {reminder.auto ? 'Task: ' : ''}
              {reminder.task.title}
            </span>
          </p>
        )}
      </div>

      <div className="flex shrink-0">
        {!isPast && (
          <>
            <button
              type="button"
              onClick={() => onComplete(reminder)}
              aria-label={`Mark done: ${reminder.title}`}
              className={`${iconButton} hover:bg-emerald-50 hover:text-emerald-600`}
            >
              <Check className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onDismiss(reminder)}
              aria-label={`Dismiss: ${reminder.title}`}
              className={iconButton}
            >
              <BellOff className="h-4 w-4" aria-hidden="true" />
            </button>
          </>
        )}
        {isPast && (
          <button
            type="button"
            onClick={() => onRestore(reminder)}
            aria-label={`Restore: ${reminder.title}`}
            className={iconButton}
          >
            <Undo2 className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
        {!reminder.auto && (
          <>
            <button
              type="button"
              onClick={() => onEdit(reminder)}
              aria-label={`Edit ${reminder.title}`}
              className={iconButton}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(reminder)}
              aria-label={`Delete ${reminder.title}`}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </li>
  )
}