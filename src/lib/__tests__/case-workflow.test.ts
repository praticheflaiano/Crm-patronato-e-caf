import { describe, it, expect } from '@jest/globals'
import {
  CASE_STATUSES,
  CASE_TYPES,
  CASE_STATUS_META,
  CASE_TYPE_META,
  CASE_STATUS_TRANSITIONS,
  validateStatusTransition,
  getCaseStatusMeta,
  getCaseStatusLabel,
  getCaseTypeLabel,
  getAllowedNextStatuses,
  getCaseStatusOptions,
} from '../case-workflow'

describe('CASE_STATUSES', () => {
  it('contains the 5 expected statuses', () => {
    expect(CASE_STATUSES).toHaveLength(5)
    expect(CASE_STATUSES).toContain('open')
    expect(CASE_STATUSES).toContain('in_progress')
    expect(CASE_STATUSES).toContain('pending_documents')
    expect(CASE_STATUSES).toContain('completed')
    expect(CASE_STATUSES).toContain('rejected')
  })
})

describe('CASE_TYPES', () => {
  it('contains the 4 expected types', () => {
    expect(CASE_TYPES).toHaveLength(4)
    expect(CASE_TYPES).toContain('caf')
    expect(CASE_TYPES).toContain('patronato')
    expect(CASE_TYPES).toContain('invalidita_civile')
    expect(CASE_TYPES).toContain('tari')
  })
})

describe('CASE_STATUS_META', () => {
  it('has label, description and badgeClassName for each status', () => {
    for (const status of CASE_STATUSES) {
      const meta = CASE_STATUS_META[status]
      expect(typeof meta.label).toBe('string')
      expect(meta.label.length).toBeGreaterThan(0)
      expect(typeof meta.description).toBe('string')
      expect(typeof meta.badgeClassName).toBe('string')
    }
  })

  it('open status has label "Aperta"', () => {
    expect(CASE_STATUS_META.open.label).toBe('Aperta')
  })

  it('completed status has label "Completata"', () => {
    expect(CASE_STATUS_META.completed.label).toBe('Completata')
  })
})

describe('CASE_TYPE_META', () => {
  it('has label and description for each type', () => {
    for (const type of CASE_TYPES) {
      const meta = CASE_TYPE_META[type]
      expect(typeof meta.label).toBe('string')
      expect(meta.label.length).toBeGreaterThan(0)
      expect(typeof meta.description).toBe('string')
    }
  })

  it('caf has label "CAF"', () => {
    expect(CASE_TYPE_META.caf.label).toBe('CAF')
  })
})

describe('CASE_STATUS_TRANSITIONS', () => {
  it('open can transition to in_progress, pending_documents, rejected', () => {
    expect(CASE_STATUS_TRANSITIONS.open).toEqual(['in_progress', 'pending_documents', 'rejected'])
  })

  it('completed has no allowed transitions', () => {
    expect(CASE_STATUS_TRANSITIONS.completed).toEqual([])
  })

  it('rejected has no allowed transitions', () => {
    expect(CASE_STATUS_TRANSITIONS.rejected).toEqual([])
  })

  it('in_progress can transition to pending_documents, completed, rejected', () => {
    expect(CASE_STATUS_TRANSITIONS.in_progress).toEqual(['pending_documents', 'completed', 'rejected'])
  })
})

describe('validateStatusTransition', () => {
  it('null current status allows only "open" as new status', () => {
    expect(validateStatusTransition(null, 'open')).toBe(true)
    expect(validateStatusTransition(null, 'in_progress')).toBe(false)
    expect(validateStatusTransition(null, 'completed')).toBe(false)
  })

  it('open → in_progress is valid', () => {
    expect(validateStatusTransition('open', 'in_progress')).toBe(true)
  })

  it('open → pending_documents is valid', () => {
    expect(validateStatusTransition('open', 'pending_documents')).toBe(true)
  })

  it('open → completed is invalid', () => {
    expect(validateStatusTransition('open', 'completed')).toBe(false)
  })

  it('in_progress → completed is valid', () => {
    expect(validateStatusTransition('in_progress', 'completed')).toBe(true)
  })

  it('completed → open is invalid (terminal state)', () => {
    expect(validateStatusTransition('completed', 'open')).toBe(false)
  })

  it('rejected → in_progress is invalid (terminal state)', () => {
    expect(validateStatusTransition('rejected', 'in_progress')).toBe(false)
  })

  it('pending_documents → in_progress is valid', () => {
    expect(validateStatusTransition('pending_documents', 'in_progress')).toBe(true)
  })
})

describe('getCaseStatusMeta', () => {
  it('returns correct meta for known status', () => {
    const meta = getCaseStatusMeta('open')
    expect(meta.label).toBe('Aperta')
    expect(meta.badgeClassName).toContain('sky')
  })

  it('returns fallback meta for null', () => {
    const meta = getCaseStatusMeta(null)
    expect(meta.label).toBe('N/D')
    expect(meta.badgeClassName).toContain('slate')
  })

  it('returns fallback meta for undefined', () => {
    const meta = getCaseStatusMeta(undefined)
    expect(meta.label).toBe('N/D')
  })

  it('formats unknown status string with capitalization', () => {
    const meta = getCaseStatusMeta('some_unknown_status')
    expect(meta.label).toBe('Some Unknown Status')
    expect(meta.description).toBe('Stato pratica non riconosciuto.')
  })
})

describe('getCaseStatusLabel', () => {
  it('returns "Aperta" for open', () => {
    expect(getCaseStatusLabel('open')).toBe('Aperta')
  })

  it('returns "In lavorazione" for in_progress', () => {
    expect(getCaseStatusLabel('in_progress')).toBe('In lavorazione')
  })

  it('returns "Documenti mancanti" for pending_documents', () => {
    expect(getCaseStatusLabel('pending_documents')).toBe('Documenti mancanti')
  })

  it('returns "Completata" for completed', () => {
    expect(getCaseStatusLabel('completed')).toBe('Completata')
  })

  it('returns "Respinta" for rejected', () => {
    expect(getCaseStatusLabel('rejected')).toBe('Respinta')
  })

  it('returns "N/D" for null', () => {
    expect(getCaseStatusLabel(null)).toBe('N/D')
  })

  it('returns "N/D" for undefined', () => {
    expect(getCaseStatusLabel(undefined)).toBe('N/D')
  })
})

describe('getCaseTypeLabel', () => {
  it('returns "CAF" for caf', () => {
    expect(getCaseTypeLabel('caf')).toBe('CAF')
  })

  it('returns "Patronato" for patronato', () => {
    expect(getCaseTypeLabel('patronato')).toBe('Patronato')
  })

  it('returns "Invalidità Civile" for invalidita_civile', () => {
    expect(getCaseTypeLabel('invalidita_civile')).toBe('Invalidità Civile')
  })

  it('returns "TARI Roma/AMA" for tari', () => {
    expect(getCaseTypeLabel('tari')).toBe('TARI Roma/AMA')
  })

  it('returns "N/D" for null', () => {
    expect(getCaseTypeLabel(null)).toBe('N/D')
  })

  it('formats unknown type string', () => {
    expect(getCaseTypeLabel('custom_type')).toBe('Custom Type')
  })
})

describe('getAllowedNextStatuses', () => {
  it('returns ["open"] for null/undefined status', () => {
    expect(getAllowedNextStatuses(null)).toEqual(['open'])
    expect(getAllowedNextStatuses(undefined)).toEqual(['open'])
  })

  it('returns transitions for open', () => {
    const result = getAllowedNextStatuses('open')
    expect(result).toContain('in_progress')
    expect(result).toContain('pending_documents')
    expect(result).toContain('rejected')
  })

  it('returns empty array for completed (terminal)', () => {
    expect(getAllowedNextStatuses('completed')).toEqual([])
  })

  it('returns empty array for rejected (terminal)', () => {
    expect(getAllowedNextStatuses('rejected')).toEqual([])
  })
})

describe('getCaseStatusOptions', () => {
  it('for null status, returns only ["open"]', () => {
    const options = getCaseStatusOptions(null)
    expect(options).toEqual(['open'])
  })

  it('for open status, includes open and its transitions', () => {
    const options = getCaseStatusOptions('open')
    expect(options).toContain('open')
    expect(options).toContain('in_progress')
    expect(options).toContain('pending_documents')
    expect(options).toContain('rejected')
    // completed is NOT reachable from open
    expect(options).not.toContain('completed')
  })

  it('for in_progress, includes in_progress, pending_documents, completed, rejected', () => {
    const options = getCaseStatusOptions('in_progress')
    expect(options).toContain('in_progress')
    expect(options).toContain('pending_documents')
    expect(options).toContain('completed')
    expect(options).toContain('rejected')
  })

  it('for completed, returns only ["completed"] (no transitions)', () => {
    const options = getCaseStatusOptions('completed')
    expect(options).toEqual(['completed'])
  })
})
