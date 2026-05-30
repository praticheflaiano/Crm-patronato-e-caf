import { describe, it, expect } from '@jest/globals'
import { formatDistanceToNow } from '../utils'

describe('formatDistanceToNow', () => {
  it('returns a non-empty string for a past ISO date', () => {
    const result = formatDistanceToNow('2020-01-01T00:00:00Z')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('returns a string containing Italian time words for a date far in the past', () => {
    // date-fns with Italian locale should produce "fa" suffix (addSuffix: true)
    const result = formatDistanceToNow('2000-01-01T00:00:00Z')
    expect(result).toMatch(/fa$/)
  })

  it('returns a string for a very recent date (a few seconds ago)', () => {
    const recent = new Date(Date.now() - 5000).toISOString()
    const result = formatDistanceToNow(recent)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('returns a string for a future date', () => {
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    const result = formatDistanceToNow(future)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})
