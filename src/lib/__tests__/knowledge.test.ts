import { detectKind, chunkText } from '../knowledge'

describe('knowledge', () => {
  describe('detectKind', () => {
    it('detects pdf by mime type', () => {
      expect(detectKind('file', 'application/pdf')).toBe('pdf')
    })

    it('detects pdf by extension', () => {
      expect(detectKind('doc.pdf', 'unknown/type')).toBe('pdf')
    })

    it('detects docx by mime type', () => {
      expect(detectKind('file', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe('docx')
    })

    it('detects docx by extension', () => {
      expect(detectKind('doc.docx', 'unknown/type')).toBe('docx')
    })

    it('detects text by mime type', () => {
      expect(detectKind('file', 'text/plain')).toBe('text')
    })

    it('detects text by extensions', () => {
      expect(detectKind('doc.txt', 'unknown/type')).toBe('text')
      expect(detectKind('doc.md', 'unknown/type')).toBe('text')
      expect(detectKind('doc.csv', 'unknown/type')).toBe('text')
    })

    it('returns null for unknown types', () => {
      expect(detectKind('image.jpg', 'image/jpeg')).toBeNull()
      expect(detectKind('doc.doc', 'application/msword')).toBeNull()
    })
  })

  describe('chunkText', () => {
    it('returns empty array for empty or whitespace text', () => {
      expect(chunkText('')).toEqual([])
      expect(chunkText('   \n  \t ')).toEqual([])
    })

    it('chunks short text into a single chunk', () => {
      const text = 'Questo è un testo molto breve.'
      expect(chunkText(text)).toEqual([text])
    })

    it('normalizes whitespace', () => {
      const text = 'Testo\r\ncon   spazi \t anomali.'
      expect(chunkText(text)).toEqual(['Testo\ncon spazi anomali.'])
    })

    it('splits long text into multiple chunks', () => {
      // Create a string longer than 1200 chars
      const sentence = 'Questa è una frase lunga e ripetitiva per simulare un testo esteso. '
      let longText = ''
      while (longText.length < 1500) {
        longText += sentence
      }

      const chunks = chunkText(longText)
      expect(chunks.length).toBeGreaterThan(1)

      // Check that chunk size is within limits (CHUNK_SIZE = 1200)
      for (const chunk of chunks) {
        expect(chunk.length).toBeLessThanOrEqual(1200)
      }
    })
  })
})
