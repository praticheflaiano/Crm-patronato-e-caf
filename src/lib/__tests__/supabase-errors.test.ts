import { describe, it, expect } from '@jest/globals'
import { isMissingSchemaResourceError } from '../supabase-errors'

describe('isMissingSchemaResourceError', () => {
  it('returns true for PGRST205 code', () => {
    expect(isMissingSchemaResourceError({ code: 'PGRST205' })).toBe(true)
  })

  it('returns true when message includes "could not find the table"', () => {
    expect(isMissingSchemaResourceError({ message: 'could not find the table "users"' })).toBe(true)
    expect(isMissingSchemaResourceError({ message: 'Could Not Find The Table' })).toBe(true)
  })

  it('returns true when message includes "could not find a relationship"', () => {
    expect(isMissingSchemaResourceError({ message: 'could not find a relationship between table "a" and "b"' })).toBe(true)
  })

  it('returns true when message includes "schema cache"', () => {
    expect(isMissingSchemaResourceError({ message: 'schema cache is not reloaded' })).toBe(true)
  })

  it('returns false for null or undefined', () => {
    expect(isMissingSchemaResourceError(null)).toBe(false)
    expect(isMissingSchemaResourceError(undefined)).toBe(false)
  })

  it('returns false for an empty object', () => {
    expect(isMissingSchemaResourceError({})).toBe(false)
  })

  it('returns false for unrelated errors', () => {
    expect(isMissingSchemaResourceError({ code: 'PGRST116', message: 'Not found' })).toBe(false)
    expect(isMissingSchemaResourceError({ message: 'Network error' })).toBe(false)
  })

  it('handles objects without message property', () => {
    expect(isMissingSchemaResourceError({ code: 'PGRST204' })).toBe(false)
  })
})
