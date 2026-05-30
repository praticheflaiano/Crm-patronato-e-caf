import { describe, it, expect } from '@jest/globals'
import {
  toDateInputValue,
  addDays,
  startOfToday,
  isPastDate,
  isTodayDate,
  isWithinNextDays,
  formatDateIt,
} from '../date-utils'

// Helper: produce a date string N days offset from today (at midnight local)
function dateStringOffsetDays(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  // format as YYYY-MM-DD
  return d.toISOString().slice(0, 10)
}

describe('toDateInputValue', () => {
  it('returns a string in YYYY-MM-DD format', () => {
    const d = new Date('2024-06-15T12:00:00Z')
    expect(toDateInputValue(d)).toBe('2024-06-15')
  })
})

describe('addDays', () => {
  it('adds positive days correctly', () => {
    const base = new Date('2024-01-01T00:00:00Z')
    const result = addDays(base, 5)
    expect(result.getUTCDate()).toBe(6)
    expect(result.getUTCMonth()).toBe(0) // January
  })

  it('subtracts days when given a negative number', () => {
    const base = new Date('2024-01-10T00:00:00Z')
    const result = addDays(base, -3)
    expect(result.getUTCDate()).toBe(7)
  })

  it('does not mutate the original date', () => {
    const base = new Date('2024-03-01T00:00:00Z')
    const original = base.getTime()
    addDays(base, 10)
    expect(base.getTime()).toBe(original)
  })

  it('adds zero days and returns equal date', () => {
    const base = new Date('2024-05-20T00:00:00Z')
    const result = addDays(base, 0)
    expect(result.getTime()).toBe(base.getTime())
  })
})

describe('startOfToday', () => {
  it('returns a date with hours, minutes, seconds and ms zeroed', () => {
    const today = startOfToday()
    expect(today.getHours()).toBe(0)
    expect(today.getMinutes()).toBe(0)
    expect(today.getSeconds()).toBe(0)
    expect(today.getMilliseconds()).toBe(0)
  })

  it('returns today\'s date', () => {
    const today = startOfToday()
    const now = new Date()
    expect(today.getFullYear()).toBe(now.getFullYear())
    expect(today.getMonth()).toBe(now.getMonth())
    expect(today.getDate()).toBe(now.getDate())
  })
})

describe('isPastDate', () => {
  it('returns false for null', () => {
    expect(isPastDate(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isPastDate(undefined)).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isPastDate('')).toBe(false)
  })

  it('returns true for a date in the past', () => {
    expect(isPastDate('2000-01-01')).toBe(true)
  })

  it('returns false for today', () => {
    const today = dateStringOffsetDays(0)
    expect(isPastDate(today)).toBe(false)
  })

  it('returns false for a future date', () => {
    const future = dateStringOffsetDays(5)
    expect(isPastDate(future)).toBe(false)
  })

  it('returns true for yesterday', () => {
    const yesterday = dateStringOffsetDays(-1)
    expect(isPastDate(yesterday)).toBe(true)
  })
})

describe('isTodayDate', () => {
  it('returns false for null', () => {
    expect(isTodayDate(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isTodayDate(undefined)).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isTodayDate('')).toBe(false)
  })

  it('returns true for today\'s date string', () => {
    const today = dateStringOffsetDays(0)
    expect(isTodayDate(today)).toBe(true)
  })

  it('returns false for yesterday', () => {
    const yesterday = dateStringOffsetDays(-1)
    expect(isTodayDate(yesterday)).toBe(false)
  })

  it('returns false for tomorrow', () => {
    const tomorrow = dateStringOffsetDays(1)
    expect(isTodayDate(tomorrow)).toBe(false)
  })

  it('returns false for a date far in the past', () => {
    expect(isTodayDate('2000-01-01')).toBe(false)
  })
})

describe('isWithinNextDays', () => {
  it('returns false for null', () => {
    expect(isWithinNextDays(null, 7)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isWithinNextDays(undefined, 7)).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isWithinNextDays('', 7)).toBe(false)
  })

  it('returns true for today (within next 7 days)', () => {
    const today = dateStringOffsetDays(0)
    expect(isWithinNextDays(today, 7)).toBe(true)
  })

  it('returns true for a date 3 days from now (within 7)', () => {
    const future = dateStringOffsetDays(3)
    expect(isWithinNextDays(future, 7)).toBe(true)
  })

  it('returns true for exactly the boundary day (day = days param)', () => {
    const boundary = dateStringOffsetDays(7)
    expect(isWithinNextDays(boundary, 7)).toBe(true)
  })

  it('returns false for a date 8 days from now (outside 7)', () => {
    const outside = dateStringOffsetDays(8)
    expect(isWithinNextDays(outside, 7)).toBe(false)
  })

  it('returns false for yesterday', () => {
    const yesterday = dateStringOffsetDays(-1)
    expect(isWithinNextDays(yesterday, 7)).toBe(false)
  })

  it('returns false for a date in the distant past', () => {
    expect(isWithinNextDays('2000-01-01', 7)).toBe(false)
  })

  it('returns false for today when days = 0 and date is past', () => {
    // today is included (>= today and <= today+0)
    const today = dateStringOffsetDays(0)
    expect(isWithinNextDays(today, 0)).toBe(true)
  })
})

describe('formatDateIt', () => {
  it('returns "Senza scadenza" for null', () => {
    expect(formatDateIt(null)).toBe('Senza scadenza')
  })

  it('returns "Senza scadenza" for undefined', () => {
    expect(formatDateIt(undefined)).toBe('Senza scadenza')
  })

  it('returns "Senza scadenza" for empty string', () => {
    expect(formatDateIt('')).toBe('Senza scadenza')
  })

  it('returns a non-empty string for a valid date', () => {
    const result = formatDateIt('2024-06-15')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
    expect(result).not.toBe('Senza scadenza')
  })

  it('result for a known date contains the year 2024', () => {
    const result = formatDateIt('2024-06-15')
    expect(result).toContain('2024')
  })
})
