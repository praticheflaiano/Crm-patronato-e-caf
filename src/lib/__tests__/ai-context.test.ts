import { buildCaseContext, buildKnowledgeContext } from '../ai-context'
import * as embeddings from '../embeddings'

// Mock dependencies
jest.mock('../embeddings', () => ({
  embedQuery: jest.fn()
}))

jest.mock('../case-workflow', () => ({
  getCaseTypeLabel: jest.fn((val) => val),
  getCaseStatusLabel: jest.fn((val) => val)
}))

jest.mock('../date-utils', () => ({
  formatDateIt: jest.fn((val) => val)
}))

describe('ai-context', () => {
  describe('buildCaseContext', () => {
    it('returns empty string if supabase errors', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: null, error: new Error('Failed') })
      }

      const result = await buildCaseContext(mockSupabase)
      expect(result).toBe('')
    })

    it('returns empty context message if no cases found', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null })
      }

      const result = await buildCaseContext(mockSupabase)
      expect(result).toBe('CONTESTO PRATICHE: al momento non risultano pratiche visibili a questo utente.')
    })

    it('builds context with valid cases', async () => {
      const mockCases = [
        {
          id: '1',
          title: 'Pratica Test',
          status: 'open',
          type: 'caf',
          contacts: { first_name: 'Mario', last_name: 'Rossi' },
          tasks: [
            { title: 'Task 1', is_completed: false, due_date: '2025-01-01' }
          ]
        }
      ]

      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: mockCases, error: null })
      }

      const result = await buildCaseContext(mockSupabase)
      expect(result).toContain('Pratica Test')
      expect(result).toContain('Mario')
      expect(result).toContain('Rossi')
      expect(result).toContain('Task 1')
      expect(result).toContain('scadenze aperte')
    })
  })

  describe('buildKnowledgeContext', () => {
    it('returns empty string if query is empty', async () => {
      const mockSupabase = {}
      const result = await buildKnowledgeContext(mockSupabase, '   ')
      expect(result).toBe('')
    })

    it('returns empty string if embedQuery returns null', async () => {
      jest.spyOn(embeddings, 'embedQuery').mockResolvedValue(null)
      const mockSupabase = {}

      const result = await buildKnowledgeContext(mockSupabase, 'valid query')
      expect(result).toBe('')
    })

    it('returns empty string if supabase rpc fails', async () => {
      jest.spyOn(embeddings, 'embedQuery').mockResolvedValue([0.1, 0.2])
      const mockSupabase = {
        rpc: jest.fn().mockResolvedValue({ data: null, error: new Error('Fail') })
      }

      const result = await buildKnowledgeContext(mockSupabase, 'query')
      expect(result).toBe('')
    })

    it('returns context formatted blocks if matches found', async () => {
      jest.spyOn(embeddings, 'embedQuery').mockResolvedValue([0.1, 0.2])

      const mockMatches = [
        { document_title: 'Doc 1', content: 'Info about something' }
      ]

      const mockSupabase = {
        rpc: jest.fn().mockResolvedValue({ data: mockMatches, error: null })
      }

      const result = await buildKnowledgeContext(mockSupabase, 'query')
      expect(result).toContain('CONOSCENZA INTERNA')
      expect(result).toContain('[1] (fonte: Doc 1)')
      expect(result).toContain('Info about something')
    })
  })
})
