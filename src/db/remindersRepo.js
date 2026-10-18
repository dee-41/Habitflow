import { db } from './database.js'
import { newId } from '../lib/ids.js'
import { dateTimeToMs } from '../lib/dates.js'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^\d{2}:\d{2}$/
const STATUSES = ['pending', 'dismissed', 'completed']

/* ---------- Reads (use inside useLiveQuery) ---------- */

/** All reminders, each with its linked `task` (or null). */
export async function getAllReminders() {
  const [reminders, tasks] = await Promise.all([
    db.reminders.toArray(),
    db.tasks.toArray(),
  ])
  const taskById = new Map(tasks.map((t) => [t.id, t]))
  return reminders.map((r) => ({
    ...r,
    task: r.taskId ? (taskById.get(r.taskId) ?? null) : null,
  }))
}

/** Tasks that can be linked: unfinished ones, plus the one already linked. */
export async function getTasksForPicker(includeId) {
  const tasks = await db.tasks.toArray()
  return tasks
    .filter((t) => !t.completed || t.id === includeId)
    .sort((a, b) => {
      if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) {
        return a.dueDate < b.dueDate ? -1 : 1
      }
      if (a.dueDate && !b.dueDate) return -1
      if (!a.dueDate && b.dueDate) return 1
      return a.title.localeCompare(b.title)
    })
}

/* ---------- Validation ---------- */

function normalizeReminder(raw) {
  const title = (raw.title ?? '').trim()
  if (!title) throw new Error('Title is required.')
  if (title.length > 120) throw new Error('Title must be 120 characters or fewer.')
  if (!DATE_RE.test(raw.date ?? '')) throw new Error('Please choose a date.')
  if (!TIME_RE.test(raw.time ?? '')) throw new Error('Please choose a time.')

  const remindAt = dateTimeToMs(raw.date, raw.time)
  if (Number.isNaN(remindAt)) throw new Error('That date or time is not valid.')

  return { title, remindAt, taskId: raw.taskId || null }
}

async function assertTaskExists(taskId) {
  if (taskId && !(await db.tasks.get(taskId))) {
    throw new Error('The linked task no longer exists.')
  }
}

/* ---------- Writes ---------- */

export async function createReminder(input) {
  const fields = normalizeReminder(input)
  if (fields.remindAt <= Date.now()) throw new Error('Choose a time in the future.')
  await assertTaskExists(fields.taskId)

  const reminder = {
    id: newId(),
    ...fields,
    auto: false,
    status: 'pending',
    notifiedAt: null,
    createdAt: Date.now(),
  }
  await db.reminders.add(reminder)
  return reminder
}

export async function updateReminder(id, input) {
  const existing = await db.reminders.get(id)
  if (!existing) throw new Error('This reminder no longer exists.')
  if (existing.auto) {
    throw new Error('This reminder is managed by its task. Edit the task instead.')
  }

  const fields = normalizeReminder(input)
  const rescheduled = fields.remindAt !== existing.remindAt
  if (rescheduled && fields.remindAt <= Date.now()) {
    throw new Error('Choose a time in the future.')
  }
  await assertTaskExists(fields.taskId)

  await db.reminders.put({
    ...existing,
    ...fields,
    // A new time means it should be able to fire again.
    status: rescheduled ? 'pending' : existing.status,
    notifiedAt: rescheduled ? null : (existing.notifiedAt ?? null),
  })
}

export async function setReminderStatus(id, status) {
  if (!STATUSES.includes(status)) throw new Error('Unknown reminder status.')
  const updated = await db.reminders.update(id, { status })
  if (!updated) throw new Error('This reminder no longer exists.')
}

export async function deleteReminder(id) {
  const existing = await db.reminders.get(id)
  if (!existing) return
  if (existing.auto) {
    throw new Error('This reminder is managed by its task. Edit or delete the task instead.')
  }
  await db.reminders.delete(id)
}

/**
 * Atomically marks due, pending, not-yet-notified reminders as notified and
 * returns the ones recent enough to be worth a notification.
 * Doing this inside one transaction means two open tabs can't both claim
 * the same reminder.
 */
export async function claimDueReminders(now, graceMs) {
  return db.transaction('rw', db.reminders, async () => {
    const due = await db.reminders
      .where('remindAt')
      .belowOrEqual(now)
      .filter((r) => r.status === 'pending' && !r.notifiedAt)
      .toArray()

    const toShow = []
    for (const r of due) {
      await db.reminders.update(r.id, { notifiedAt: now })
      if (now - r.remindAt <= graceMs) toShow.push(r)
    }
    return toShow
  })
}