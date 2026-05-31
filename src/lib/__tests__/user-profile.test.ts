import { describe, it, expect } from '@jest/globals'

// user-profile.ts imports the server-only Supabase client at module load; mock it
// so this stays a pure unit test for the access-gate logic.
jest.mock('../../utils/supabase/server', () => ({
  createClient: jest.fn(),
  createAdminClient: jest.fn(),
}))

import { isActiveMember } from '../user-profile'

describe('isActiveMember', () => {
  it('returns false for a null profile', () => {
    expect(isActiveMember(null)).toBe(false)
  })

  it('returns false for a pending account', () => {
    expect(isActiveMember({ status: 'pending', organization_id: null })).toBe(false)
  })

  it('returns false for a disabled account even if it still has an org', () => {
    expect(isActiveMember({ status: 'disabled', organization_id: 'org-1' })).toBe(false)
  })

  it('returns false for an active account without an organization', () => {
    expect(isActiveMember({ status: 'active', organization_id: null })).toBe(false)
  })

  it('returns true only for an active account with an organization', () => {
    expect(isActiveMember({ status: 'active', organization_id: 'org-1' })).toBe(true)
  })
})
