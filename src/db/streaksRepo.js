import { db } from './database.js'
import { newId } from '../lib/ids.js'
import { todayKey } from '../lib/dates.js'
import { STREAK_COLORS } from '../lib/streakColors.js'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/* ---------- Reads (use inside useLiveQuery) ---------- */

/** All streaks (active and archived), each with `dates`: its completion keys. */
export async function getStreaksWithCompletions() {
  const [streaks, completions] = await Promise.all([
    db.streaks.toArray(),
    db.streakCompletions.toArray(),
  ])
  const byStreak = new Map()
  for (const c of completions) {
    if (!byStreak.has(c.streakId)) byStreak.set(c.streakId, [])
    byStreak.get(c.streakId).push(c.date)
  }
  return streaks
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((s) => ({ ...s, dates: byStreak.get(s.id) ?? [] }))
}

/* ---------- Validation ---------- */

function normalizeStreak(raw) {
  const name = (raw.name ?? '').trim()
  if (!name) throw new Error('Name is required.')
  if (name.length > 60) throw new Error('Name must be 60 characters or fewer.')

  const description = (raw.description ?? '').trim()
  if (description.length > 200) {
    throw new Error('Description must be 200 characters or fewer.')
  }

  if (!DATE_RE.test(raw.startDate ?? '')) throw new Error('Please choose a start date.')

  const color = STREAK_COLORS[raw.color] ? raw.color : 'emerald'

  return { ...raw, name, description, color }
}

/* ---------- Writes ---------- */

export async function createStreak(input) {
  const streak = normalizeStreak({
    ...input,
    id: newId(),
    archived: false,
    createdAt: Date.now(),
  })
  await db.streaks.add(streak)
  return streak
}

export async function updateStreak(id, changes) {
  const existing = await db.streaks.get(id)
  if (!existing) throw new Error('This streak no longer exists.')
  // Only the streak record changes, so completion history is untouched.
  await db.streaks.put(normalizeStreak({ ...existing, ...changes }))
}

export async function setStreakArchived(id, archived) {
  const updated = await db.streaks.update(id, { archived: Boolean(archived) })
  if (!updated) throw new Error('This streak no longer exists.')
}

/** Permanently deletes a streak and all of its completion marks. */
export async function deleteStreak(id) {
  await db.transaction('rw', db.streaks, db.streakCompletions, async () => {
    await db.streakCompletions.where('streakId').equals(id).delete()
    await db.streaks.delete(id)
  })
}

/** Marks the day complete, or removes the mark if it already exists. */
export async function toggleStreakDay(streakId, dateKey) {
  if (dateKey > todayKey()) throw new Error("You can't mark a future date.")

  await db.transaction('rw', db.streakCompletions, db.streaks, async () => {
    const streak = await db.streaks.get(streakId)
    if (!streak) throw new Error('This streak no longer exists.')

    const existing = await db.streakCompletions
      .where('[streakId+date]')
      .equals([streakId, dateKey])
      .first()

    if (existing) {
      await db.streakCompletions.delete(existing.id)
    } else {
      await db.streakCompletions.add({
        id: newId(),
        streakId,
        date: dateKey,
        completedAt: Date.now(),
      })
    }
  })
}