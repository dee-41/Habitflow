import Dexie from 'dexie'
import { format } from 'date-fns'

export const db = new Dexie('habitflow-db')

/**
 * SCHEMA
 *
 * v1 (original):
 *   habits, habitCompletions, tasks, reminders, dayMarks, settings
 *
 * v2 (redesign):
 *   + streaks            { id, name, description, color, startDate("yyyy-MM-dd"),
 *                          archived, createdAt }
 *   + streakCompletions  { id, streakId, date("yyyy-MM-dd"), completedAt }
 *                        &[streakId+date] = UNIQUE, one mark per streak per day
 *
 *   tasks (unchanged schema) now also store: reminderOffset (minutes|null)
 *   reminders (unchanged schema) now also store: auto (true for task-created ones)
 *
 *   The old `habits` / `habitCompletions` tables are KEPT (read-only legacy)
 *   so that no user data is ever deleted. Their rows are copied into the new
 *   tables by the upgrade function below.
 *
 * NOTE: booleans are not valid IndexedDB keys, so never query by `archived`
 * or `completed` with .where(); filter in JavaScript instead.
 */
db.version(1).stores({
  habits: 'id, name, archived, createdAt',
  habitCompletions: 'id, &[habitId+date], habitId, date',
  tasks: 'id, dueDate, completed, createdAt',
  reminders: 'id, remindAt, taskId, status',
  dayMarks: 'date',
  settings: 'key',
})

db.version(2)
  .stores({
    streaks: 'id, name, archived, createdAt',
    streakCompletions: 'id, &[streakId+date], streakId, date',
  })
  .upgrade(async (tx) => {
    const habits = await tx.table('habits').toArray()
    const completions = await tx.table('habitCompletions').toArray()

    // Earliest completion per habit, used as the streak start date if it
    // precedes the creation date.
    const earliest = new Map()
    for (const c of completions) {
      const current = earliest.get(c.habitId)
      if (!current || c.date < current) earliest.set(c.habitId, c.date)
    }

    await tx.table('streaks').bulkPut(
      habits.map((h) => {
        const createdKey = format(new Date(h.createdAt ?? Date.now()), 'yyyy-MM-dd')
        const first = earliest.get(h.id)
        return {
          id: h.id, // same id, so the migration is idempotent
          name: h.name,
          description: h.description ?? '',
          color: !h.color || h.color === 'green' ? 'emerald' : h.color,
          startDate: first && first < createdKey ? first : createdKey,
          archived: Boolean(h.archived),
          createdAt: h.createdAt ?? Date.now(),
        }
      }),
    )

    await tx.table('streakCompletions').bulkPut(
      completions.map((c) => ({
        id: c.id,
        streakId: c.habitId,
        date: c.date,
        completedAt: c.completedAt ?? Date.now(),
      })),
    )
  })

/* ---------- Settings helpers ---------- */

export async function getSetting(key, fallback = undefined) {
  const row = await db.settings.get(key)
  return row ? row.value : fallback
}

export async function setSetting(key, value) {
  await db.settings.put({ key, value })
}

/* ---------- Initialization ---------- */

async function runInitialization() {
  await db.open()

  // Ask the browser to treat our storage as persistent (best effort).
  let persisted = false
  try {
    if (navigator.storage?.persisted) {
      persisted = await navigator.storage.persisted()
      if (!persisted && navigator.storage.persist) {
        persisted = await navigator.storage.persist()
      }
    }
  } catch {
    // Not critical.
  }

  const first = await db.settings.get('firstOpenedAt')
  if (!first) {
    await db.settings.put({ key: 'firstOpenedAt', value: Date.now() })
  }

  return { persisted }
}

// Cached so React StrictMode's double-invoked effects initialize only once.
let initPromise = null

export function initializeDatabase() {
  if (!initPromise) {
    initPromise = runInitialization().catch((err) => {
      initPromise = null // allow retry after failure
      throw err
    })
  }
  return initPromise
}