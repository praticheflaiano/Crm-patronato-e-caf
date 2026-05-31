// Calls the `embed` Supabase Edge Function (gte-small, 384 dims, key-less).
// The function requires a JWT, so we invoke it through an authenticated
// Supabase client (functions.invoke attaches the session token automatically).

import { EMBEDDING_DIMENSIONS } from '@/lib/knowledge'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function embedTexts(supabase: any, inputs: string[]): Promise<number[][]> {
  if (inputs.length === 0) return []
  const { data, error } = await supabase.functions.invoke('embed', {
    body: { input: inputs },
  })
  if (error) {
    throw new Error(`Embedding non riuscito: ${error.message ?? 'errore sconosciuto'}`)
  }
  const embeddings = data?.embeddings
  if (!Array.isArray(embeddings) || embeddings.length !== inputs.length) {
    throw new Error('Risposta embedding non valida.')
  }
  for (const e of embeddings) {
    if (!Array.isArray(e) || e.length !== EMBEDDING_DIMENSIONS) {
      throw new Error('Dimensione embedding inattesa.')
    }
  }
  return embeddings as number[][]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function embedQuery(supabase: any, query: string): Promise<number[] | null> {
  try {
    const [embedding] = await embedTexts(supabase, [query])
    return embedding ?? null
  } catch {
    return null
  }
}
