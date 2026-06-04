'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { getOrCreateUserProfile } from '@/lib/user-profile'
import { parseCsv } from '@/lib/csv'
import { CASE_TYPES } from '@/lib/case-workflow'

type ImportResult = {
  ok: boolean
  message?: string
  inserted?: number
  skipped?: number
  errors?: string[]
}

function pick(row: Record<string, string>, keys: string[]): string {
  for (const k of keys) {
    if (row[k] != null && row[k] !== '') return row[k]
  }
  return ''
}

export async function importCases(formData: FormData): Promise<ImportResult> {
  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: 'Seleziona un file CSV.' }
  }
  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, message: 'Il file supera il limite di 5 MB.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'Accesso richiesto.' }

  const profile = await getOrCreateUserProfile(user)
  if (!profile?.organization_id) return { ok: false, message: 'Profilo non disponibile.' }

  const rows = parseCsv(await file.text())
  if (rows.length === 0) {
    return { ok: false, message: 'Il CSV è vuoto o non ha intestazioni valide.' }
  }
  if (rows.length > 2000) {
    return { ok: false, message: 'Troppe righe (max 2000 per import).' }
  }

  const errors: string[] = []
  const payload: Record<string, unknown>[] = []

  // We need to resolve contact_id from fiscal code
  const fiscalCodesToFetch = new Set<string>()

  rows.forEach((row, i) => {
    const lineNo = i + 2 // header is line 1
    const title = pick(row, ['titolo', 'title'])
    const description = pick(row, ['descrizione', 'description'])
    let type = pick(row, ['tipo', 'type']).toLowerCase()
    let status = pick(row, ['stato', 'status']).toLowerCase()
    const fiscalCode = pick(row, ['codice fiscale', 'codice_fiscale', 'fiscal_code', 'cf']).toUpperCase()

    if (!title || !type || !fiscalCode) {
      errors.push(`Riga ${lineNo}: titolo, tipo e codice fiscale cliente sono obbligatori.`)
      return
    }

    if (!CASE_TYPES.includes(type as never)) {
      if (type === 'invalidità civile' || type === 'invalidita civile') type = 'invalidita_civile'
      else {
        errors.push(`Riga ${lineNo}: tipo pratica non valido (${type}).`)
        return
      }
    }

    const validStatuses = ['open', 'in_progress', 'pending_documents', 'completed', 'rejected']
    if (!status) status = 'open'
    else if (!validStatuses.includes(status)) {
      // rough mapping from italian
      if (status === 'aperta') status = 'open'
      else if (status === 'in lavorazione' || status === 'in_lavorazione') status = 'in_progress'
      else if (status === 'attesa documenti') status = 'pending_documents'
      else if (status === 'completata') status = 'completed'
      else if (status === 'rifiutata') status = 'rejected'
      else {
        errors.push(`Riga ${lineNo}: stato pratica non valido (${status}).`)
        return
      }
    }

    fiscalCodesToFetch.add(fiscalCode)

    payload.push({
      _lineNo: lineNo,
      title,
      description: description || null,
      type,
      status,
      _fiscalCode: fiscalCode,
      organization_id: profile.organization_id,
      // no user_id by default? cases doesn't seem to have user_id, only organization_id, created_by maybe?
      // Wait, let's check cases table schema. It has contact_id, title, description, status, type, assigned_to
    })
  })

  if (payload.length === 0) {
    return { ok: false, message: 'Nessuna riga valida da importare.', errors: errors.slice(0, 10) }
  }

  // Fetch contacts for these fiscal codes in the current org
  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, fiscal_code')
    .eq('organization_id', profile.organization_id)
    .in('fiscal_code', Array.from(fiscalCodesToFetch))

  const contactMap = new Map<string, string>()
  if (contacts) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contacts.forEach((c: any) => contactMap.set(c.fiscal_code, c.id))
  }

  let inserted = 0
  let skipped = 0
  for (const item of payload) {
    const contactId = contactMap.get(item._fiscalCode as string)
    if (!contactId) {
      errors.push(`Riga ${item._lineNo}: contatto con codice fiscale ${item._fiscalCode} non trovato.`)
      skipped++
      continue
    }

    const caseData = {
      title: item.title,
      description: item.description,
      type: item.type,
      status: item.status,
      contact_id: contactId,
      organization_id: item.organization_id,
    }

    const { error } = await supabase.from('cases').insert(caseData as never)
    if (error) {
      skipped++
      if (errors.length < 10) errors.push(`Riga ${item._lineNo}: errore inserimento (${error.message}).`)
    } else {
      inserted++
    }
  }

  revalidatePath('/cases')
  return {
    ok: true,
    inserted,
    skipped,
    errors: errors.slice(0, 10),
    message: `Importate ${inserted} pratiche${skipped ? `, ${skipped} saltate` : ''}.`,
  }
}
