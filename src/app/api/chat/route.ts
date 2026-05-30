import { createOpenAI } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { hasSupabaseConfig } from '@/utils/supabase/config'
import { createClient } from '@/utils/supabase/server'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

const openRouterModel = process.env.OPENROUTER_MODEL?.trim() || 'minimax/minimax-m2.7'
const openRouterSiteUrl = process.env.OPENROUTER_SITE_URL?.trim() || 'https://crm-patronato-e-caf.vercel.app'
const openRouterAppName = process.env.OPENROUTER_APP_NAME?.trim() || 'Centro Pratiche Flaiano CRM'

// Best-effort per-user rate limiting. On serverless this is per-instance only,
// but it still curbs runaway usage and accidental loops without extra infra.
const RATE_LIMIT_MAX = 20
const RATE_LIMIT_WINDOW_MS = 60_000
const MAX_MESSAGES = 50
const MAX_TOTAL_CHARS = 24_000

const rateLimitBuckets = new Map<string, number[]>()

function isRateLimited(userId: string): boolean {
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW_MS
  const recent = (rateLimitBuckets.get(userId) ?? []).filter((ts) => ts > windowStart)
  recent.push(now)
  rateLimitBuckets.set(userId, recent)
  return recent.length > RATE_LIMIT_MAX
}

export async function POST(req: Request) {
  if (!hasSupabaseConfig()) {
    return new Response('Supabase is not configured', { status: 503 })
  }

  // Ensure user is authenticated
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  if (isRateLimited(user.id)) {
    return new Response('Troppe richieste. Attendi un minuto e riprova.', { status: 429 })
  }

  const body = await req.json().catch(() => null)
  const messages = body?.messages

  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    return new Response('Richiesta non valida.', { status: 400 })
  }

  const totalChars = JSON.stringify(messages).length
  if (totalChars > MAX_TOTAL_CHARS) {
    return new Response('Conversazione troppo lunga. Inizia una nuova chat.', { status: 413 })
  }

  const openRouterApiKey = process.env.OPENROUTER_API_KEY?.trim()

  if (!openRouterApiKey) {
    return new Response('Assistente AI non configurato: manca OPENROUTER_API_KEY.', { status: 503 })
  }

  // RAG Logic would go here in the future:
  // 1. Generate embedding for the last user message
  // 2. Query Supabase pgvector for relevant context
  // 3. Append context to the system prompt

  const openrouter = createOpenAI({
    apiKey: openRouterApiKey,
    baseURL: 'https://openrouter.ai/api/v1',
    name: 'openrouter',
    headers: {
      'HTTP-Referer': openRouterSiteUrl,
      'X-Title': openRouterAppName,
    },
  })

  try {
    const result = streamText({
      model: openrouter(openRouterModel),
      system: `Sei l'assistente virtuale del CAF, Patronato e TARI "Centro Pratiche Flaiano".
      Il tuo compito è aiutare gli operatori a gestire pratiche, consultare documentazione e rispondere a domande normative.
      Se la richiesta riguarda TARI Roma/AMA, privilegia sempre le fonti ufficiali AMA Roma e Roma Capitale e segnala quando un dato va verificato sul portale ufficiale.
      Rispondi in italiano, in modo operativo e sintetico. Non fornire mai diagnosi mediche. Se non conosci una risposta, dillo chiaramente.`,
      messages,
    })

    return result.toTextStreamResponse()
  } catch (chatError) {
    console.error('OpenRouter chat failed:', chatError instanceof Error ? chatError.message : 'unknown error')

    return new Response('Assistente AI temporaneamente non disponibile. Verifica configurazione OpenRouter e riprova.', { status: 502 })
  }
}
