import { describe, it, expect } from '@jest/globals'
import { toCsv, parseCsv } from '../csv'

describe('toCsv', () => {
  it('renders header labels and escapes special characters', () => {
    const out = toCsv(
      [{ a: 'hello, world', b: 'quote "x"' }],
      [{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }],
    )
    expect(out).toContain('A,B')
    expect(out).toContain('"hello, world"')
    expect(out).toContain('"quote ""x"""')
  })

  it('renders null/undefined as empty fields', () => {
    const out = toCsv([{ a: null, b: undefined }], [{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }])
    const lines = out.replace(/^﻿/, '').trim().split('\r\n')
    expect(lines[1]).toBe(',')
  })
})

describe('parseCsv', () => {
  it('parses headers (lower-cased) and rows', () => {
    const rows = parseCsv('Nome,Cognome\r\nMario,Rossi\r\nLuigi,Verdi\r\n')
    expect(rows).toHaveLength(2)
    expect(rows[0]).toEqual({ nome: 'Mario', cognome: 'Rossi' })
    expect(rows[1].cognome).toBe('Verdi')
  })

  it('auto-detects the semicolon separator', () => {
    const rows = parseCsv('nome;cognome\nMario;Rossi')
    expect(rows[0]).toEqual({ nome: 'Mario', cognome: 'Rossi' })
  })

  it('handles quoted fields containing the delimiter and escaped quotes', () => {
    const rows = parseCsv('nome,note\n"Rossi, Mario","ha detto ""ok"""')
    expect(rows[0].nome).toBe('Rossi, Mario')
    expect(rows[0].note).toBe('ha detto "ok"')
  })

  it('strips a UTF-8 BOM and ignores blank lines', () => {
    const rows = parseCsv('﻿nome,cognome\nMario,Rossi\n\n')
    expect(rows).toHaveLength(1)
    expect(rows[0].nome).toBe('Mario')
  })

  it('returns an empty array when there is no data row', () => {
    expect(parseCsv('nome,cognome')).toEqual([])
    expect(parseCsv('')).toEqual([])
  })
})
