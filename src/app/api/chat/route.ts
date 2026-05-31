import { createOpenAI } from '@ai-sdk/openai'
import { convertToModelMessages, streamText, type UIMessage } from 'ai'
import { hasSupabaseConfig } from '@/utils/supabase/config'
import { createClient, createAdminClient } from '@/utils/supabase/server'
import { getOrCreateUserProfile } from '@/lib/user-profile'

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function readKeyFromSettings(client: any, organizationId: string): Promise<string | null> {
  try {
    const { data } = await client
      .from('app_settings')
      .select('openrouter_api_key')
      .eq('organization_id', organizationId)
      .maybeSingle()
    const key = data?.openrouter_api_key
    return key ? String(key).trim() || null : null
  } catch {
    return null
  }
}

// Resolve the OpenRouter key: the in-app, admin-configured key (per organization)
// takes precedence over the OPENROUTER_API_KEY env var. It is read server-side
// only, so it is never exposed to the browser. The service-role client is used
// when available so the assistant works for every member; admins can also read
// their own org row directly. Falls back to the env var for env-based setups.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveOpenRouterKey(userClient: any, organizationId: string | null): Promise<string | null> {
  if (organizationId) {
    try {
      const admin = createAdminClient()
      const key = await readKeyFromSettings(admin, organizationId)
      if (key) return key
    } catch {
      // Service role not configured; fall through to the caller's own client.
    }
    const key = await readKeyFromSettings(userClient, organizationId)
    if (key) return key
  }
  return process.env.OPENROUTER_API_KEY?.trim() || null
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

  // Only allow 'user' and 'assistant' roles from the client. Any client-supplied
  // 'system' (or other) role is ignored so the server-side system prompt below
  // stays authoritative and cannot be overridden by the client.
  const safeMessages = messages.filter(
    (m) => m && (m.role === 'user' || m.role === 'assistant')
  )

  if (safeMessages.length === 0) {
    return new Response('Richiesta non valida.', { status: 400 })
  }

  const totalChars = JSON.stringify(safeMessages).length
  if (totalChars > MAX_TOTAL_CHARS) {
    return new Response('Conversazione troppo lunga. Inizia una nuova chat.', { status: 413 })
  }

  const profile = await getOrCreateUserProfile(user)
  const openRouterApiKey = await resolveOpenRouterKey(supabase, profile?.organization_id ?? null)

  if (!openRouterApiKey) {
    return new Response('Assistente AI non configurato: aggiungi la chiave OpenRouter nelle Impostazioni.', { status: 503 })
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
      messages: await convertToModelMessages(safeMessages as UIMessage[]),
    })

    return result.toUIMessageStreamResponse()
  } catch (chatError) {
    console.error('OpenRouter chat failed:', chatError instanceof Error ? chatError.message : 'unknown error')

    return new Response('Assistente AI temporaneamente non disponibile. Verifica configurazione OpenRouter e riprova.', { status: 502 })
  }
}
