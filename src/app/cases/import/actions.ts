'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { getOrCreateUserProfile } from '@/lib/user-profile'
import { parseCsv } from '@/lib/csv'

type ImportResult = {
  ok: boolean
  message?: string
  inserted?: number
  skipped?: number
  errors?: string[]
}

// Accepts flexible Italian/English header names for each contact field.
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

  rows.forEach((row, i) => {
    const lineNo = i + 2 // header is line 1
    const title = pick(row, ['titolo', 'title'])
    const type = pick(row, ['tipo', 'type'])?.toLowerCase() as 'caf' | 'patronato' | 'invalidita_civile' | 'tari'
    const status = pick(row, ['stato', 'status'])?.toLowerCase() as 'open' | 'in_progress' | 'pending_documents' | 'completed' | 'rejected'
    const fiscalCode = pick(row, ['codice fiscale', 'codice_fiscale', 'fiscal_code', 'cf', 'cliente_cf']).toUpperCase()
    const description = pick(row, ['descrizione', 'description', 'note'])

    if (!title || !type || !fiscalCode) {
      errors.push(`Riga ${lineNo}: titolo, tipo e codice fiscale cliente sono obbligatori.`)
      return
    }

    const validTypes = ['caf', 'patronato', 'invalidita_civile', 'tari']
    if (!validTypes.includes(type)) {
      errors.push(`Riga ${lineNo}: tipo non valido (${type}). Usare caf, patronato, invalidita_civile o tari.`)
      return
    }

    const validStatuses = ['open', 'in_progress', 'pending_documents', 'completed', 'rejected']
    if (status && !validStatuses.includes(status)) {
      errors.push(`Riga ${lineNo}: stato non valido (${status}). Usare open, in_progress, pending_documents, completed o rejected.`)
      return
    }

    payload.push({
      title,
      type,
      status: status || 'open',
      fiscal_code: fiscalCode,
      description: description || null,
      organization_id: profile.organization_id,
      assigned_to: user.id,
      line_no: lineNo,
    })
  })

  if (payload.length === 0) {
    return { ok: false, message: 'Nessuna riga valida da importare.', errors: errors.slice(0, 10) }
  }

  let inserted = 0
  let skipped = 0

  // Need to lookup contact_ids for the fiscal codes
  for (const caseItem of payload) {
    const fiscal_code = String(caseItem.fiscal_code)
    const line_no = Number(caseItem.line_no)
    const { fiscal_code: _fc, line_no: _ln, ...caseData } = caseItem

    // Find contact by fiscal_code
    const { data: contactData } = await supabase
      .from('contacts')
      .select('id')
      .eq('fiscal_code', fiscal_code)
      .eq('organization_id', profile.organization_id)
      .single()

    if (!contactData) {
      skipped++
      if (errors.length < 10) errors.push(`Riga ${line_no}: cliente con codice fiscale ${fiscal_code} non trovato.`)
      continue
    }

    const finalData = {
      ...caseData,
      contact_id: (contactData as { id: string }).id,
    }

    const { error } = await supabase.from('cases').insert(finalData as never)
    if (error) {
      skipped++
      if (errors.length < 10) errors.push(`Riga ${line_no}: errore durante l'importazione. ${error.message}`)
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
