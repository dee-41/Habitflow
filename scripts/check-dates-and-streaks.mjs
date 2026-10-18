import assert from 'node:assert/strict'
import { calculateStreaks } from '../src/lib/streaks.js'
import { getMonthGrid, toDateKey } from '../src/lib/dates.js'

let passed = 0
function check(name, fn) {
  fn()
  passed++
  console.log(`  ok  ${name}`)
}

console.log('Streak calculations')

check('no marks', () => {
  assert.deepEqual(calculateStreaks([], '2026-10-16'), { current: 0, longest: 0, total: 0 })
})

check('run ending today', () => {
  const r = calculateStreaks(['2026-10-14', '2026-10-15', '2026-10-16'], '2026-10-16')
  assert.equal(r.current, 3)
  assert.equal(r.longest, 3)
})

check('streak stays alive when only today is unmarked', () => {
  assert.equal(calculateStreaks(['2026-10-14', '2026-10-15'], '2026-10-16').current, 2)
})

check('streak is broken after a missed day', () => {
  const r = calculateStreaks(['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-05'], '2026-10-16')
  assert.equal(r.current, 0)
  assert.equal(r.longest, 3)
})

check('duplicates and future dates are ignored', () => {
  const r = calculateStreaks(['2026-10-17', '2026-10-16', '2026-10-16'], '2026-10-16')
  assert.deepEqual(r, { current: 1, longest: 1, total: 1 })
})

check('month boundary', () => {
  assert.equal(calculateStreaks(['2026-02-28', '2026-03-01'], '2026-03-01').current, 2)
})

check('leap day', () => {
  const r = calculateStreaks(['2028-02-28', '2028-02-29', '2028-03-01'], '2028-03-01')
  assert.equal(r.current, 3)
})

check('year boundary', () => {
  assert.equal(calculateStreaks(['2026-12-31', '2027-01-01'], '2027-01-01').current, 2)
})

check('daylight saving changes (US spring and fall, EU spring)', () => {
  const sets = [
    ['2026-03-07', '2026-03-08', '2026-03-09'],
    ['2026-03-28', '2026-03-29', '2026-03-30'],
    ['2026-10-31', '2026-11-01', '2026-11-02'],
  ]
  for (const keys of sets) {
    const r = calculateStreaks(keys, keys[2])
    assert.equal(r.current, 3, keys.join(','))
    assert.equal(r.longest, 3, keys.join(','))
  }
})

console.log('Month grids')

check('grids are whole weeks, start on Sunday, and have no repeated days', () => {
  for (let year = 2026; year <= 2029; year++) {
    for (let month = 0; month < 12; month++) {
      const days = getMonthGrid(new Date(year, month, 15))
      assert.equal(days.length % 7, 0, `${year}-${month + 1} length`)
      assert.equal(days[0].getDay(), 0, `${year}-${month + 1} first day`)
      const keys = days.map(toDateKey)
      assert.equal(new Set(keys).size, keys.length, `${year}-${month + 1} duplicates`)
    }
  }
})

check('February 2028 contains the 29th exactly once', () => {
  const keys = getMonthGrid(new Date(2028, 1, 1)).map(toDateKey)
  assert.equal(keys.filter((k) => k === '2028-02-29').length, 1)
})

console.log(`\nAll ${passed} checks passed.`)