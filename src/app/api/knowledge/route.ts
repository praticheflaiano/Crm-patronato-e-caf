/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getOrCreateUserProfile } from '@/lib/user-profile'
import { getSafeErrorMessage } from '@/lib/supabase-errors'
import { chunkText, detectKind, extractText } from '@/lib/knowledge'
import { embedTexts } from '@/lib/embeddings'

export const maxDuration = 60

const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10 MB
// gte-small runs inside the embed Edge Function, which has a tight memory
// budget; embedding too many texts per call trips WORKER_RESOURCE_LIMIT. Small
// batches stay well within limits (≈0.9s for 6 texts), so use 4 for headroom.
const EMBED_BATCH = 4

// List the organization's knowledge documents.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { data, error } = await supabase
    .from('knowledge_documents')
    .select('id, title, source_type, status, error_message, chunk_count, byte_size, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: getSafeErrorMessage(error) }, { status: 500 })
  return NextResponse.json(Array.isArray(data) ? data : [])
}

// Add a document: either an uploaded file (multipart) or pasted text.
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const profile = await getOrCreateUserProfile(user)
  if (!profile || !profile.organization_id) {
    return NextResponse.json({ error: 'Profilo non abilitato.' }, { status: 403 })
  }
  const organizationId = profile.organization_id

  let title = ''
  let sourceType: 'file' | 'text' = 'text'
  let rawText = ''
  let byteSize = 0

  const contentType = request.headers.get('content-type') || ''
  try {
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      const file = form.get('file') as File | null
      title = String(form.get('title') || (file?.name ?? '')).trim()
      if (!file) return NextResponse.json({ error: 'Nessun file ricevuto.' }, { status: 400 })
      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json({ error: 'File troppo grande (max 10 MB).' }, { status: 413 })
      }
      const kind = detectKind(file.name, file.type)
      if (!kind) {
        return NextResponse.json({ error: 'Formato non supportato. Usa PDF, Word (.docx) o testo.' }, { status: 415 })
      }
      const buffer = Buffer.from(await file.arrayBuffer())
      byteSize = buffer.byteLength
      sourceType = 'file'
      rawText = await extractText(buffer, kind)
      if (!title) title = file.name
    } else {
      const body = await request.json().catch(() => null)
      title = String(body?.title || '').trim()
      rawText = String(body?.text || '')
      sourceType = 'text'
      byteSize = Buffer.byteLength(rawText, 'utf-8')
      if (!title) return NextResponse.json({ error: 'Titolo richiesto.' }, { status: 400 })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'estrazione testo non riuscita'
    return NextResponse.json({ error: `Impossibile leggere il contenuto: ${message}` }, { status: 422 })
  }

  const chunks = chunkText(rawText)
  if (chunks.length === 0) {
    return NextResponse.json({ error: 'Nessun testo estratto dal documento.' }, { status: 422 })
  }

  // Create the document row first (status processing) so the UI can show it.
  const { data: docRow, error: insErr } = await supabase
    .from('knowledge_documents')
    .insert({
      organization_id: organizationId,
      title,
      source_type: sourceType,
      byte_size: byteSize,
      status: 'processing',
      created_by: user.id,
    } as never)
    .select('id')
    .single()

  if (insErr || !docRow) {
    return NextResponse.json({ error: getSafeErrorMessage(insErr) }, { status: 500 })
  }
  const documentId = (docRow as any).id as string

  try {
    let stored = 0
    for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
      const batch = chunks.slice(i, i + EMBED_BATCH)
      const embeddings = await embedTexts(supabase, batch)
      const rows = batch.map((content, j) => ({
        document_id: documentId,
        organization_id: organizationId,
        chunk_index: i + j,
        content,
        embedding: embeddings[j] as unknown,
      }))
      const { error: chunkErr } = await supabase.from('knowledge_chunks').insert(rows as never)
      if (chunkErr) throw new Error(getSafeErrorMessage(chunkErr))
      stored += batch.length
    }

    await supabase
      .from('knowledge_documents')
      .update({ status: 'ready', chunk_count: stored } as never)
      .eq('id', documentId)

    return NextResponse.json({ ok: true, id: documentId, chunks: stored })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'indicizzazione non riuscita'
    await supabase
      .from('knowledge_documents')
      .update({ status: 'error', error_message: message } as never)
      .eq('id', documentId)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// Delete a document (chunks cascade via FK).
export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id mancante' }, { status: 400 })

  const { error } = await supabase.from('knowledge_documents').delete().eq('id', id)
  if (error) return NextResponse.json({ error: getSafeErrorMessage(error) }, { status: 500 })
  return NextResponse.json({ ok: true })
}
