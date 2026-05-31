import { getCaseStatusLabel, getCaseTypeLabel } from '@/lib/case-workflow'
import { formatDateIt } from '@/lib/date-utils'
import { embedQuery } from '@/lib/embeddings'

// Builds a compact, plain-text summary of the user's cases to ground the AI
// assistant in real data. IMPORTANT: it queries with the caller's authenticated
// Supabase client, so Row Level Security applies and the assistant only ever
// sees the cases that the asking user is allowed to see. No clinical/medical
// detail is included (the assistant must never reason about diagnoses); only
// administrative case metadata, the linked citizen's name, and open deadlines.

const MAX_CASES = 40
const MAX_TASKS_PER_CASE = 3

type AnyRecord = Record<string, unknown>

function asArray(value: unknown): AnyRecord[] {
  return Array.isArray(value) ? (value as AnyRecord[]) : []
}

function contactName(contact: unknown): string {
  const c = contact as AnyRecord | null
  if (!c) return 'Contatto non associato'
  const last = String(c.last_name ?? '').trim()
  const first = String(c.first_name ?? '').trim()
  const full = `${last} ${first}`.trim()
  return full || 'Contatto non associato'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function buildCaseContext(supabase: any): Promise<string> {
  let cases: AnyRecord[] = []
  try {
    const { data, error } = await supabase
      .from('cases')
      .select(
        'id, title, status, type, description, updated_at, contacts(first_name, last_name, fiscal_code), tasks(id, title, due_date, is_completed)'
      )
      .order('updated_at', { ascending: false })
      .limit(MAX_CASES)
    if (error) return ''
    cases = asArray(data)
  } catch {
    return ''
  }

  if (cases.length === 0) {
    return 'CONTESTO PRATICHE: al momento non risultano pratiche visibili a questo utente.'
  }

  const lines = cases.map((c, index) => {
    const openTasks = asArray(c.tasks)
      .filter((t) => !t.is_completed && t.due_date)
      .sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)))
      .slice(0, MAX_TASKS_PER_CASE)
      .map((t) => `${String(t.title ?? 'attività')} (scad. ${formatDateIt(String(t.due_date))})`)

    const parts = [
      `${index + 1}. "${String(c.title ?? 'Senza titolo')}"`,
      `cittadino: ${contactName(c.contacts)}`,
      `tipo: ${getCaseTypeLabel(String(c.type ?? ''))}`,
      `stato: ${getCaseStatusLabel(String(c.status ?? ''))}`,
    ]
    if (openTasks.length) parts.push(`scadenze aperte: ${openTasks.join('; ')}`)
    return parts.join(' · ')
  })

  return [
    `CONTESTO PRATICHE (${cases.length} pratiche più recenti visibili a questo utente, dati riservati dell'organizzazione):`,
    ...lines,
    'Usa questi dati per rispondere a domande su pratiche, cittadini e scadenze. Non inventare pratiche non elencate. Non dedurre né commentare informazioni sanitarie/diagnosi.',
  ].join('\n')
}

// Retrieves the knowledge-base chunks most relevant to the user's question
// (RAG). Embeds the query with the key-less `embed` Edge Function and runs the
// org-scoped similarity search. Returns '' when there is no knowledge base or no
// relevant match, so the prompt stays clean.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function buildKnowledgeContext(supabase: any, query: string): Promise<string> {
  const trimmed = query.trim()
  if (!trimmed) return ''

  const embedding = await embedQuery(supabase, trimmed)
  if (!embedding) return ''

  let matches: AnyRecord[] = []
  try {
    const { data, error } = await supabase.rpc('match_knowledge_chunks', {
      query_embedding: embedding,
      match_count: 5,
      similarity_threshold: 0.3,
    })
    if (error) return ''
    matches = asArray(data)
  } catch {
    return ''
  }

  if (matches.length === 0) return ''

  const blocks = matches.map((m, i) => {
    const title = String(m.document_title ?? 'documento')
    const content = String(m.content ?? '').trim()
    return `[${i + 1}] (fonte: ${title})\n${content}`
  })

  return [
    'CONOSCENZA INTERNA (estratti dai documenti caricati dall\'organizzazione, pertinenti alla domanda):',
    ...blocks,
    'Usa questi estratti come fonte prioritaria quando rispondi. Cita la fonte tra parentesi quando ti basi su di essi. Se non contengono la risposta, dillo e non inventare.',
  ].join('\n\n')
}
