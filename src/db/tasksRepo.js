import { db } from './database.js'
import { newId } from '../lib/ids.js'
import { dateTimeToMs } from '../lib/dates.js'
import { DEFAULT_REMINDER_TIME } from '../lib/taskOptions.js'

/* ---------- Reads (use inside useLiveQuery) ---------- */

function sortTasks(a, b) {
  // Timed tasks first (by time), untimed after, then oldest first.
  if (a.dueTime && b.dueTime && a.dueTime !== b.dueTime) {
    return a.dueTime < b.dueTime ? -1 : 1
  }
  if (a.dueTime && !b.dueTime) return -1
  if (!a.dueTime && b.dueTime) return 1
  return a.createdAt - b.createdAt
}

export async function getTasksForDate(dateKey) {
  const tasks = await db.tasks.where('dueDate').equals(dateKey).toArray()
  return tasks.sort(sortTasks)
}
export async function getAllTasks() {
  return db.tasks.toArray()
}
export async function getTasksInRange(startKey, endKey) {
  const tasks = await db.tasks
    .where('dueDate')
    .between(startKey, endKey, true, true)
    .toArray()
  return tasks.sort(sortTasks)
}

/* ---------- Helpers ---------- */

/** Validates and normalizes a task object before it is stored. */
function normalizeTask(raw) {
  const title = (raw.title ?? '').trim()
  if (!title) throw new Error('Title is required.')
  if (title.length > 120) throw new Error('Title must be 120 characters or fewer.')

  const description = (raw.description ?? '').trim()
  if (description.length > 500) {
    throw new Error('Description must be 500 characters or fewer.')
  }

  const dueDate = raw.dueDate || null
  const dueTime = dueDate && raw.dueTime ? raw.dueTime : null
  const reminderOffset =
    dueDate && raw.reminderOffset != null && raw.reminderOffset !== ''
      ? Number(raw.reminderOffset)
      : null

  return {
    ...raw,
    title,
    description,
    dueDate,
    dueTime,
    reminderOffset,
    completed: Boolean(raw.completed),
    completedAt: raw.completed ? (raw.completedAt ?? Date.now()) : null,
  }
}

/**
 * Keeps the task's auto-created reminder in sync with the task.
 * Must be called inside a transaction that includes db.reminders.
 */
async function syncAutoReminder(task) {
  const existing = await db.reminders
    .where('taskId')
    .equals(task.id)
    .filter((r) => r.auto)
    .toArray()

  if (task.reminderOffset == null || !task.dueDate) {
    await db.reminders.bulkDelete(existing.map((r) => r.id))
    return
  }

  const dueMs = dateTimeToMs(task.dueDate, task.dueTime ?? DEFAULT_REMINDER_TIME)
  const remindAt = dueMs - task.reminderOffset * 60_000
  const keep = existing.find((r) => r.remindAt === remindAt)

  // Remove stale ones (e.g. the task was rescheduled).
  await db.reminders.bulkDelete(
    existing.filter((r) => r !== keep).map((r) => r.id),
  )

  if (keep) {
    // Mirror completion state without overriding a manual dismissal.
    if (task.completed && keep.status === 'pending') {
      await db.reminders.update(keep.id, { status: 'completed' })
    } else if (!task.completed && keep.status === 'completed') {
      await db.reminders.update(keep.id, { status: 'pending' })
    }
    return
  }

    const now = Date.now()
  await db.reminders.add({
    id: newId(),
    title: task.title,
    remindAt,
    taskId: task.id,
    auto: true,
    status: task.completed ? 'completed' : 'pending',
    // Already in the past (e.g. "at due time" for earlier today): show it as
    // due in the app, but don't fire a surprise notification.
    notifiedAt: remindAt <= now ? now : null,
    createdAt: now,
  })
}

/* ---------- Writes ---------- */

export async function createTask(input) {
  const task = normalizeTask({
    ...input,
    id: newId(),
    completed: false,
    createdAt: Date.now(),
  })
  await db.transaction('rw', db.tasks, db.reminders, async () => {
    await db.tasks.add(task)
    await syncAutoReminder(task)
  })
  return task
}

export async function updateTask(id, changes) {
  await db.transaction('rw', db.tasks, db.reminders, async () => {
    const existing = await db.tasks.get(id)
    if (!existing) throw new Error('This task no longer exists.')
    const merged = normalizeTask({ ...existing, ...changes })
    await db.tasks.put(merged)
    await syncAutoReminder(merged)
  })
}

export async function setTaskCompleted(id, completed) {
  await db.transaction('rw', db.tasks, db.reminders, async () => {
    const existing = await db.tasks.get(id)
    if (!existing) throw new Error('This task no longer exists.')
    const merged = normalizeTask({
      ...existing,
      completed,
      completedAt: completed ? Date.now() : null,
    })
    await db.tasks.put(merged)
    await syncAutoReminder(merged)
  })
}

export async function deleteTask(id) {
  await db.transaction('rw', db.tasks, db.reminders, async () => {
    const linked = await db.reminders.where('taskId').equals(id).toArray()
    // Auto reminders belong to the task; manual ones are kept but unlinked.
    await db.reminders.bulkDelete(linked.filter((r) => r.auto).map((r) => r.id))
    for (const r of linked.filter((r) => !r.auto)) {
      await db.reminders.update(r.id, { taskId: null })
    }
    await db.tasks.delete(id)
  })
}