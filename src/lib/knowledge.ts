// Text extraction + chunking for the knowledge base (RAG).
//
// Runs server-side only (used by API routes). PDF parsing uses unpdf (a
// serverless-safe pdf.js build), Word (.docx) uses mammoth; plain text and
// pasted snippets pass through.

export const EMBEDDING_DIMENSIONS = 384

// Roughly 1,200 characters per chunk with a small overlap so context isn't lost
// across chunk boundaries. Kept simple and deterministic (no token model needed).
const CHUNK_SIZE = 1200
const CHUNK_OVERLAP = 150
const MAX_CHUNKS = 400

export type ExtractableKind = 'pdf' | 'docx' | 'text'

export function detectKind(fileName: string, mimeType: string): ExtractableKind | null {
  const name = fileName.toLowerCase()
  if (mimeType === 'application/pdf' || name.endsWith('.pdf')) return 'pdf'
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    name.endsWith('.docx')
  ) {
    return 'docx'
  }
  if (mimeType.startsWith('text/') || name.endsWith('.txt') || name.endsWith('.md') || name.endsWith('.csv')) {
    return 'text'
  }
  return null
}

export async function extractText(buffer: Buffer, kind: ExtractableKind): Promise<string> {
  if (kind === 'text') {
    return buffer.toString('utf-8')
  }
  if (kind === 'docx') {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    return result.value ?? ''
  }
  // pdf — use unpdf, a serverless-safe pdf.js build. pdf-parse pulls in the
  // browser pdf.js which needs DOM APIs (DOMMatrix) absent on Vercel's runtime.
  const { extractText: extractPdfText, getDocumentProxy } = await import('unpdf')
  const doc = await getDocumentProxy(new Uint8Array(buffer))
  const { text } = await extractPdfText(doc, { mergePages: true })
  return Array.isArray(text) ? text.join('\n') : (text ?? '')
}

// Normalize whitespace and split into overlapping chunks on paragraph/sentence
// boundaries where possible.
export function chunkText(raw: string): string[] {
  const text = raw.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
  if (!text) return []

  const chunks: string[] = []
  let start = 0
  while (start < text.length && chunks.length < MAX_CHUNKS) {
    let end = Math.min(start + CHUNK_SIZE, text.length)

    // Prefer to break at a paragraph or sentence boundary within the window.
    if (end < text.length) {
      const window = text.slice(start, end)
      const breakAt = Math.max(window.lastIndexOf('\n\n'), window.lastIndexOf('. '), window.lastIndexOf('\n'))
      if (breakAt > CHUNK_SIZE * 0.5) {
        end = start + breakAt + 1
      }
    }

    const piece = text.slice(start, end).trim()
    if (piece) chunks.push(piece)
    if (end >= text.length) break
    start = Math.max(end - CHUNK_OVERLAP, start + 1)
  }
  return chunks
}
