import { describe, it, expect } from '@jest/globals'
import {
  TARI_OFFICIAL_SOURCES,
  TARI_WORKFLOW_STEPS,
  TARI_DOCUMENT_CHECKLISTS,
  TARI_MODULE_MAP,
  TARI_ARCHIVING_TEMPLATE,
  getTariPracticeLabel,
} from '../tari'

describe('TARI_OFFICIAL_SOURCES', () => {
  it('is a non-empty array', () => {
    expect(TARI_OFFICIAL_SOURCES.length).toBeGreaterThan(0)
  })

  it('every source has title, href and note', () => {
    for (const source of TARI_OFFICIAL_SOURCES) {
      expect(typeof source.title).toBe('string')
      expect(source.title.length).toBeGreaterThan(0)
      expect(typeof source.href).toBe('string')
      expect(source.href).toMatch(/^https?:\/\//)
      expect(typeof source.note).toBe('string')
    }
  })

  it('contains the AMA Roma main portal', () => {
    const titles = TARI_OFFICIAL_SOURCES.map((s) => s.title)
    expect(titles).toContain('AMA Roma — TARI')
  })
})

describe('TARI_WORKFLOW_STEPS', () => {
  it('has exactly 4 steps', () => {
    expect(TARI_WORKFLOW_STEPS).toHaveLength(4)
  })

  it('every step has title, summary and bullets', () => {
    for (const step of TARI_WORKFLOW_STEPS) {
      expect(typeof step.title).toBe('string')
      expect(step.title.length).toBeGreaterThan(0)
      expect(typeof step.summary).toBe('string')
      expect(Array.isArray(step.bullets)).toBe(true)
      expect(step.bullets.length).toBeGreaterThan(0)
    }
  })

  it('first step is "1. Classificazione iniziale"', () => {
    expect(TARI_WORKFLOW_STEPS[0].title).toBe('1. Classificazione iniziale')
  })

  it('last step is "4. Controllo qualità finale"', () => {
    expect(TARI_WORKFLOW_STEPS[3].title).toBe('4. Controllo qualità finale')
  })
})

describe('TARI_DOCUMENT_CHECKLISTS', () => {
  it('has exactly 3 checklists', () => {
    expect(TARI_DOCUMENT_CHECKLISTS).toHaveLength(3)
  })

  it('every checklist has title and bullets', () => {
    for (const checklist of TARI_DOCUMENT_CHECKLISTS) {
      expect(typeof checklist.title).toBe('string')
      expect(checklist.title.length).toBeGreaterThan(0)
      expect(Array.isArray(checklist.bullets)).toBe(true)
      expect(checklist.bullets.length).toBeGreaterThan(0)
    }
  })
})

describe('TARI_MODULE_MAP', () => {
  it('contains at least 5 modules', () => {
    expect(TARI_MODULE_MAP.length).toBeGreaterThanOrEqual(5)
  })

  it('every module has code, title, useCase and note', () => {
    for (const mod of TARI_MODULE_MAP) {
      expect(typeof mod.code).toBe('string')
      expect(mod.code.length).toBeGreaterThan(0)
      expect(typeof mod.title).toBe('string')
      expect(typeof mod.useCase).toBe('string')
      expect(typeof mod.note).toBe('string')
    }
  })

  it('includes MOD600 (main activation/cessation/variation module)', () => {
    const codes = TARI_MODULE_MAP.map((m) => m.code)
    expect(codes).toContain('MOD600')
  })

  it('includes MOD608 (autotutela)', () => {
    const codes = TARI_MODULE_MAP.map((m) => m.code)
    expect(codes).toContain('MOD608')
  })
})

describe('TARI_ARCHIVING_TEMPLATE', () => {
  it('is a non-empty array of strings', () => {
    expect(TARI_ARCHIVING_TEMPLATE.length).toBeGreaterThan(0)
    for (const line of TARI_ARCHIVING_TEMPLATE) {
      expect(typeof line).toBe('string')
    }
  })

  it('first entry references client folder pattern', () => {
    expect(TARI_ARCHIVING_TEMPLATE[0]).toContain('clienti/')
  })
})

describe('getTariPracticeLabel', () => {
  it('returns "Attivazione" for "attivazione"', () => {
    expect(getTariPracticeLabel('attivazione')).toBe('Attivazione')
  })

  it('returns "Variazione" for "variazione"', () => {
    expect(getTariPracticeLabel('variazione')).toBe('Variazione')
  })

  it('returns "Cessazione" for "cessazione"', () => {
    expect(getTariPracticeLabel('cessazione')).toBe('Cessazione')
  })

  it('returns "Riduzione" for "riduzione"', () => {
    expect(getTariPracticeLabel('riduzione')).toBe('Riduzione')
  })

  it('returns "Esenzione" for "esenzione"', () => {
    expect(getTariPracticeLabel('esenzione')).toBe('Esenzione')
  })

  it('returns "Pagamento" for "pagamento"', () => {
    expect(getTariPracticeLabel('pagamento')).toBe('Pagamento')
  })

  it('returns "Rateizzazione" for "rateizzazione"', () => {
    expect(getTariPracticeLabel('rateizzazione')).toBe('Rateizzazione')
  })

  it('returns "Rimborso / compensazione" for "rimborso"', () => {
    expect(getTariPracticeLabel('rimborso')).toBe('Rimborso / compensazione')
  })

  it('returns "Contestazione / autotutela" for "contestazione"', () => {
    expect(getTariPracticeLabel('contestazione')).toBe('Contestazione / autotutela')
  })

  it('returns "Ravvedimento operoso" for "ravvedimento"', () => {
    expect(getTariPracticeLabel('ravvedimento')).toBe('Ravvedimento operoso')
  })

  it('returns "Pratica TARI" for null', () => {
    expect(getTariPracticeLabel(null)).toBe('Pratica TARI')
  })

  it('returns "Pratica TARI" for undefined', () => {
    expect(getTariPracticeLabel(undefined)).toBe('Pratica TARI')
  })

  it('returns "Pratica TARI" for an unknown kind string', () => {
    expect(getTariPracticeLabel('unknown_kind')).toBe('Pratica TARI')
  })
})
