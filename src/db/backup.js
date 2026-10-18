import { isValid, parseISO } from 'date-fns'
import { db, getSetting, setSetting } from './database.js'

export const BACKUP_APP = 'habitflow'
export const BACKUP_FORMAT_VERSION = 1
export const MAX_IMPORT_BYTES = 25 * 1024 * 1024

/**
 * BACKUP FILE FORMAT (version 1)
 * {
 *   app: "habitflow", formatVersion: 1, exportedAt: <ms>, summary: {...},
 *   data: { tasks: [], reminders: [], streaks: [], streakCompletions: [],
 *           dayMarks: [], settings: [], habits: [], habitCompletions: [] }
 * }
 * Device-specific settings (see DEVICE_SETTINGS) are never exported or imported.
 */
const TABLE_NAMES = [
  'tasks',
  'reminders',
  'streaks',
  'streakCompletions',
  'dayMarks',
  'settings',
  'habits',
  'habitCompletions',
]
const REQUIRED_TABLES = ['tasks', 'reminders', 'streaks', 'streakCompletions']
const DEVICE_SETTINGS = ['lastBackupAt']

/* ---------- Small validators ---------- */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^\d{2}:\d{2}$/
const REMINDER_STATUSES = ['pending', 'dismissed', 'completed']

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const isId = (v) => typeof v === 'string' && v.length > 0 && v.length <= 200
const isNum = (v) => typeof v === 'number' && Number.isFinite(v)
const isDateKey = (v) => typeof v === 'string' && DATE_RE.test(v) && isValid(parseISO(v))
const isTimeKey = (v) => typeof v === 'string' && TIME_RE.test(v)
const isText = (v) => typeof v === 'string' && v.trim().length > 0

/**
 * Per-table rules. `check` returns a problem description or null.
 * `key` must be unique; `pair` (optional) must be unique as a combination,
 * mirroring the unique indexes in the database.
 */
const RULES = {
  tasks: {
    key: 'id',
    check: (r) => {
      if (!isId(r.id)) return 'has no valid id'
      if (!isText(r.title)) return 'has no title'
      if (r.dueDate != null && !isDateKey(r.dueDate)) return 'has an invalid date'
      if (r.dueTime != null && !isTimeKey(r.dueTime)) return 'has an invalid time'
      if (typeof r.completed !== 'boolean') return 'has an invalid completed value'
      if (!isNum(r.createdAt)) return 'has no creation time'
      return null
    },
  },
  reminders: {
    key: 'id',
    check: (r) => {
      if (!isId(r.id)) return 'has no valid id'
      if (!isText(r.title)) return 'has no title'
      if (!isNum(r.remindAt)) return 'has an invalid reminder time'
      if (!REMINDER_STATUSES.includes(r.status)) return 'has an invalid status'
      if (r.taskId != null && !isId(r.taskId)) return 'has an invalid task link'
      return null
    },
  },
  streaks: {
    key: 'id',
    check: (r) => {
      if (!isId(r.id)) return 'has no valid id'
      if (!isText(r.name)) return 'has no name'
      if (!isDateKey(r.startDate)) return 'has an invalid start date'
      if (!isNum(r.createdAt)) return 'has no creation time'
      return null
    },
  },
  streakCompletions: {
    key: 'id',
    pair: ['streakId', 'date'],
    check: (r) => {
      if (!isId(r.id)) return 'has no valid id'
      if (!isId(r.streakId)) return 'has no streak'
      if (!isDateKey(r.date)) return 'has an invalid date'
      return null
    },
  },
  dayMarks: {
    key: 'date',
    check: (r) => (isDateKey(r.date) ? null : 'has an invalid date'),
  },
  settings: {
    key: 'key',
    check: (r) => (isId(r.key) ? null : 'has no valid key'),
  },
  habits: {
    key: 'id',
    check: (r) => {
      if (!isId(r.id)) return 'has no valid id'
      if (!isText(r.name)) return 'has no name'
      return null
    },
  },
  habitCompletions: {
    key: 'id',
    pair: ['habitId', 'date'],
    check: (r) => {
      if (!isId(r.id)) return 'has no valid id'
      if (!isId(r.habitId)) return 'has no habit'
      if (!isDateKey(r.date)) return 'has an invalid date'
      return null
    },
  },
}

function validateTable(name, rows) {
  const rule = RULES[name]
  const seenKeys = new Set()
  const seenPairs = new Set()

  rows.forEach((row, index) => {
    const fail = (problem) => {
      throw new Error(`The backup is damaged: ${name} entry ${index + 1} ${problem}.`)
    }
    if (!isObject(row)) fail('is not a valid record')
    const problem = rule.check(row)
    if (problem) fail(problem)

    if (seenKeys.has(row[rule.key])) fail(`is a duplicate (${rule.key} "${row[rule.key]}")`)
    seenKeys.add(row[rule.key])

    if (rule.pair) {
      const pair = JSON.stringify([row[rule.pair[0]], row[rule.pair[1]]])
      if (seenPairs.has(pair)) fail('duplicates another record for the same day')
      seenPairs.add(pair)
    }
  })
}

/* ---------- Summaries ---------- */

export function summarize(data) {
  return {
    tasks: data.tasks.length,
    reminders: data.reminders.length,
    streaks: data.streaks.length,
    streakDays: data.streakCompletions.length,
  }
}

function plural(n, word) {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

export function describeSummary(s) {
  return [
    plural(s.tasks, 'task'),
    plural(s.reminders, 'reminder'),
    `${plural(s.streaks, 'streak')} (${plural(s.streakDays, 'marked day')})`,
  ].join(', ')
}

/** Live counts of what is currently stored (use inside useLiveQuery). */
export async function getDataSummary() {
  const [tasks, reminders, streaks, streakDays] = await Promise.all([
    db.tasks.count(),
    db.reminders.count(),
    db.streaks.count(),
    db.streakCompletions.count(),
  ])
  return { tasks, reminders, streaks, streakDays }
}

/* ---------- Last export (stored on this device only) ---------- */

export function getLastBackupAt() {
  return getSetting('lastBackupAt', null)
}

export function markExported() {
  return setSetting('lastBackupAt', Date.now())
}

/* ---------- Export ---------- */

export async function exportAllData() {
  const tables = TABLE_NAMES.map((name) => db.table(name))

  // One read transaction = one consistent snapshot.
  const data = await db.transaction('r', tables, async () => {
    const out = {}
    for (const name of TABLE_NAMES) out[name] = await db.table(name).toArray()
    return out
  })
  data.settings = data.settings.filter((s) => !DEVICE_SETTINGS.includes(s.key))

  return {
    app: BACKUP_APP,
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt: Date.now(),
    summary: summarize(data),
    data,
  }
}

/* ---------- Import ---------- */

/**
 * Parses and fully validates backup file text.
 * Throws an Error with a user-friendly message if anything is wrong.
 * Returns { data, exportedAt } and does NOT touch the database.
 */
export function parseBackup(text) {
  let json
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error("This file isn't valid JSON, so it can't be a HabitFlow backup.")
  }

  if (!isObject(json) || json.app !== BACKUP_APP) {
    throw new Error("This doesn't look like a HabitFlow backup file.")
  }
  if (!Number.isInteger(json.formatVersion) || json.formatVersion < 1) {
    throw new Error('This backup has no valid format version.')
  }
  if (json.formatVersion > BACKUP_FORMAT_VERSION) {
    throw new Error(
      'This backup was made by a newer version of HabitFlow and can\'t be imported here.',
    )
  }
  if (!isObject(json.data)) throw new Error('The backup has no data section.')

  const data = {}
  for (const name of TABLE_NAMES) {
    const rows = json.data[name]
    if (rows === undefined) {
      if (REQUIRED_TABLES.includes(name)) {
        throw new Error(`The backup is missing its "${name}" data.`)
      }
      data[name] = []
    } else if (!Array.isArray(rows)) {
      throw new Error(`The backup is damaged: "${name}" is not a list.`)
    } else {
      data[name] = rows
    }
  }

  data.settings = data.settings.filter(
    (s) => !(isObject(s) && DEVICE_SETTINGS.includes(s.key)),
  )

  for (const name of TABLE_NAMES) validateTable(name, data[name])

  const streakIds = new Set(data.streaks.map((s) => s.id))
  data.streakCompletions.forEach((c, index) => {
    if (!streakIds.has(c.streakId)) {
      throw new Error(
        `The backup is damaged: streakCompletions entry ${index + 1} belongs to a streak that isn't in the file.`,
      )
    }
  })

  return {
    data,
    exportedAt: isNum(json.exportedAt) ? json.exportedAt : null,
  }
}

/**
 * Replaces ALL stored data with `data` (already validated by parseBackup).
 * Runs in one transaction: if anything fails, nothing is changed.
 */
export async function importBackup(data) {
  const tables = TABLE_NAMES.map((name) => db.table(name))

  await db.transaction('rw', tables, async () => {
    const keep = await Promise.all(DEVICE_SETTINGS.map((key) => db.settings.get(key)))

    for (const table of tables) await table.clear()
    for (const name of TABLE_NAMES) {
      if (data[name].length > 0) await db.table(name).bulkAdd(data[name])
    }

    // Device-specific settings survive an import.
    for (const row of keep) if (row) await db.settings.put(row)
  })
}