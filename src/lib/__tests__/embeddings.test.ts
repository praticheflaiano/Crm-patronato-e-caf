import { embedTexts, embedQuery } from '../embeddings'
import { EMBEDDING_DIMENSIONS } from '../knowledge'

describe('embeddings', () => {
  describe('embedTexts', () => {
    it('returns empty array if inputs are empty', async () => {
      const mockSupabase = {
        functions: { invoke: jest.fn() }
      }

      const result = await embedTexts(mockSupabase, [])
      expect(result).toEqual([])
      expect(mockSupabase.functions.invoke).not.toHaveBeenCalled()
    })

    it('throws error if edge function fails', async () => {
      const mockSupabase = {
        functions: {
          invoke: jest.fn().mockResolvedValue({ data: null, error: new Error('Network error') })
        }
      }

      await expect(embedTexts(mockSupabase, ['test'])).rejects.toThrow('Embedding non riuscito: Network error')
    })

    it('throws error if response format is invalid (no array)', async () => {
      const mockSupabase = {
        functions: {
          invoke: jest.fn().mockResolvedValue({ data: { embeddings: 'not-an-array' }, error: null })
        }
      }

      await expect(embedTexts(mockSupabase, ['test'])).rejects.toThrow('Risposta embedding non valida.')
    })

    it('throws error if response dimension is incorrect', async () => {
      const mockSupabase = {
        functions: {
          invoke: jest.fn().mockResolvedValue({ data: { embeddings: [[1, 2, 3]] }, error: null })
        }
      }

      await expect(embedTexts(mockSupabase, ['test'])).rejects.toThrow('Dimensione embedding inattesa.')
    })

    it('returns valid embeddings', async () => {
      const mockEmbedding = Array(EMBEDDING_DIMENSIONS).fill(0.1)
      const mockSupabase = {
        functions: {
          invoke: jest.fn().mockResolvedValue({ data: { embeddings: [mockEmbedding] }, error: null })
        }
      }

      const result = await embedTexts(mockSupabase, ['test text'])
      expect(result).toEqual([mockEmbedding])
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('embed', { body: { input: ['test text'] } })
    })
  })

  describe('embedQuery', () => {
    it('returns null if embedTexts fails', async () => {
      const mockSupabase = {
        functions: {
          invoke: jest.fn().mockResolvedValue({ data: null, error: new Error('Failed') })
        }
      }

      const result = await embedQuery(mockSupabase, 'query')
      expect(result).toBeNull()
    })

    it('returns a single embedding array', async () => {
      const mockEmbedding = Array(EMBEDDING_DIMENSIONS).fill(0.5)
      const mockSupabase = {
        functions: {
          invoke: jest.fn().mockResolvedValue({ data: { embeddings: [mockEmbedding] }, error: null })
        }
      }

      const result = await embedQuery(mockSupabase, 'valid query')
      expect(result).toEqual(mockEmbedding)
    })
  })
})
