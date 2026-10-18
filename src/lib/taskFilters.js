/**
 * Task buckets, relative to today:
 *   completed | overdue | today | upcoming | general (no due date)
 */
export function getBucket(task, today) {
  if (task.completed) return 'completed'
  if (!task.dueDate) return 'general'
  if (task.dueDate < today) return 'overdue'
  if (task.dueDate === today) return 'today'
  return 'upcoming'
}

export const FILTERS = [
  { id: 'pending', label: 'Pending' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'general', label: 'No date' },
  { id: 'completed', label: 'Completed' },
]

/** Does a task belong under this filter tab? */
export function inFilter(task, filterId, today) {
  const bucket = getBucket(task, today)
  switch (filterId) {
    case 'pending':
      return bucket !== 'completed'
    case 'overdue':
      return bucket === 'overdue'
    case 'upcoming':
      return bucket === 'today' || bucket === 'upcoming'
    case 'general':
      return bucket === 'general'
    case 'completed':
      return bucket === 'completed'
    default:
      return true
  }
}

export function matchesSearch(task, query) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    task.title.toLowerCase().includes(q) ||
    (task.description ?? '').toLowerCase().includes(q)
  )
}

/** Dated tasks: earliest first, timed before untimed within a day. */
function compareDated(a, b) {
  if (a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1
  if (a.dueTime && b.dueTime && a.dueTime !== b.dueTime) {
    return a.dueTime < b.dueTime ? -1 : 1
  }
  if (a.dueTime && !b.dueTime) return -1
  if (!a.dueTime && b.dueTime) return 1
  return a.createdAt - b.createdAt
}

export function sortTasks(tasks, filterId) {
  const list = [...tasks]
  if (filterId === 'completed') {
    return list.sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
  }
  if (filterId === 'general') {
    return list.sort((a, b) => b.createdAt - a.createdAt)
  }
  return list.sort((a, b) => {
    // Dated tasks before undated ones; undated newest first.
    if (a.dueDate && b.dueDate) return compareDated(a, b)
    if (a.dueDate) return -1
    if (b.dueDate) return 1
    return b.createdAt - a.createdAt
  })
}