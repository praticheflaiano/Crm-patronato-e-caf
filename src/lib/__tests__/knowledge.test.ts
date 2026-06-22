import { describe, it, expect } from '@jest/globals'
import { chunkText, CHUNK_SIZE, CHUNK_OVERLAP, MAX_CHUNKS } from '../knowledge'

describe('chunkText', () => {
  it('returns an empty array for empty or whitespace-only input', () => {
    expect(chunkText('')).toEqual([])
    expect(chunkText('   ')).toEqual([])
    expect(chunkText('\n\n\n')).toEqual([])
  })

  it('normalizes whitespace but preserves single newlines', () => {
    const input = 'Hello \t \r\n world.\n\n\nNew paragraph.'
    const result = chunkText(input)
    expect(result).toHaveLength(1)
    // \r\n becomes \n
    // " \t " becomes " "
    // " " before world stays " "
    // \n\n\n becomes \n\n
    expect(result[0]).toBe('Hello \n world.\n\nNew paragraph.')
  })

  it('returns a single chunk for short text', () => {
    const input = 'Short text.'
    const result = chunkText(input)
    expect(result).toEqual(['Short text.'])
  })

  it('splits at paragraph boundaries (\\n\\n)', () => {
    const p1 = 'A'.repeat(CHUNK_SIZE - 200)
    const p2 = 'B'.repeat(CHUNK_SIZE - 200)
    const input = `${p1}\n\n${p2}`
    const result = chunkText(input)

    expect(result.length).toBeGreaterThanOrEqual(2)
    expect(result[0]).toBe(p1)
    // The second chunk should start with some overlap
    expect(result[1]).toMatch(/^A+/)
    expect(result[1]).toContain(p2)
  })

  it('splits at sentence boundaries (. )', () => {
    const s1 = 'Sentence one.'.padEnd(CHUNK_SIZE - 400, 'A')
    const s2 = 'Sentence two.'.padEnd(CHUNK_SIZE - 400, 'B')
    const input = s1 + '. ' + s2
    const result = chunkText(input)

    expect(result.length).toBeGreaterThanOrEqual(2)
    expect(result[0]).toBe(s1 + '.')
    expect(result[1]).toContain('Sentence two.')
  })

  it('handles text with no natural boundaries by splitting at CHUNK_SIZE', () => {
    const longWord = 'A'.repeat(CHUNK_SIZE * 2)
    const result = chunkText(longWord)
    expect(result.length).toBeGreaterThan(1)
    expect(result[0]).toHaveLength(CHUNK_SIZE)
  })

  it('respects MAX_CHUNKS', () => {
    const veryLongText = 'A '.repeat(CHUNK_SIZE * MAX_CHUNKS)
    const result = chunkText(veryLongText)
    expect(result.length).toBe(MAX_CHUNKS)
  })

  it('includes overlap between chunks', () => {
    const p1 = '1234567890'.repeat(CHUNK_SIZE / 10)
    const p2 = 'ABCDEFGHIJ'.repeat(CHUNK_SIZE / 10)
    const input = p1 + ' ' + p2
    const result = chunkText(input)

    expect(result.length).toBeGreaterThan(1)
    const lastPart = result[0].slice(-CHUNK_OVERLAP / 2)
    expect(result[1]).toContain(lastPart)
  })
})
