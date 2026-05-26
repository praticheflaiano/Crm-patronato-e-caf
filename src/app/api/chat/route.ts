import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { hasSupabaseConfig } from '@/utils/supabase/config'
import { createClient } from '@/utils/supabase/server'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  if (!hasSupabaseConfig()) {
    return new Response('Supabase is not configured', { status: 503 })
  }

  const { messages } = await req.json()

  // Ensure user is authenticated
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // RAG Logic would go here in the future:
  // 1. Generate embedding for the last user message
  // 2. Query Supabase pgvector for relevant context
  // 3. Append context to the system prompt

  const result = streamText({
    model: openai('gpt-4o'),
    system: `Sei l'assistente virtuale del CAF, Patronato e TARI "Centro Pratiche Flaiano".
    Il tuo compito è aiutare gli operatori a gestire pratiche, consultare documentazione e rispondere a domande normative.
    Se la richiesta riguarda TARI Roma/AMA, privilegia sempre le fonti ufficiali AMA Roma e Roma Capitale e segnala quando un dato va verificato sul portale ufficiale.
    Non fornire mai diagnosi mediche. Se non conosci una risposta, dillo chiaramente.`,
    messages,
  })

  return result.toTextStreamResponse()
}
