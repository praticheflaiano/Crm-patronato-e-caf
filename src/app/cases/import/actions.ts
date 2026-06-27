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

  // Fetch all contacts for this organization to link cases by fiscal code
  const { data: contactsData, error: contactsError } = await supabase
    .from('contacts')
    .select('id, fiscal_code')
    .eq('organization_id', profile.organization_id)

  if (contactsError) {
    return { ok: false, message: 'Errore nel recupero dei contatti per il mapping.' }
  }

  const contactMap = new Map<string, string>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const c of (contactsData || []) as any[]) {
    if (c.fiscal_code) {
      contactMap.set(String(c.fiscal_code).toUpperCase(), String(c.id))
    }
  }

  const errors: string[] = []
  const seen = new Set<string>()
  const payload: Record<string, unknown>[] = []

  rows.forEach((row, i) => {
    const lineNo = i + 2 // header is line 1
    const title = pick(row, ['titolo', 'title'])
    const type = pick(row, ['tipo', 'type']).toLowerCase()
    let status = pick(row, ['stato', 'status']).toLowerCase()
    const description = pick(row, ['descrizione', 'description'])
    const fiscalCode = pick(row, ['codice fiscale contatto', 'codice fiscale', 'codice_fiscale', 'fiscal_code', 'cf']).toUpperCase()

    if (!title || !type || !fiscalCode) {
      errors.push(`Riga ${lineNo}: titolo, tipo e codice fiscale contatto sono obbligatori.`)
      return
    }

    const validTypes = ['caf', 'patronato', 'invalidita_civile', 'tari']
    if (!validTypes.includes(type)) {
      errors.push(`Riga ${lineNo}: tipo "${type}" non valido (attesi: ${validTypes.join(', ')}).`)
      return
    }

    const validStatuses = ['open', 'in_progress', 'pending_documents', 'completed', 'rejected']
    if (!status || !validStatuses.includes(status)) {
      status = 'open' // Default
    }

    const contactId = contactMap.get(fiscalCode)
    if (!contactId) {
      errors.push(`Riga ${lineNo}: contatto con codice fiscale ${fiscalCode} non trovato.`)
      return
    }

    const uniqueKey = `${title}-${contactId}`
    if (seen.has(uniqueKey)) {
      errors.push(`Riga ${lineNo}: pratica duplicata nel file (${title}).`)
      return
    }
    seen.add(uniqueKey)

    payload.push({
      title,
      type,
      status,
      description: description || null,
      contact_id: contactId,
      organization_id: profile.organization_id,
      assigned_to: user.id, // Assign to the user importing by default
    })
  })

  if (payload.length === 0) {
    return { ok: false, message: 'Nessuna riga valida da importare.', errors: errors.slice(0, 10) }
  }

  let inserted = 0
  let skipped = 0
  for (const caseItem of payload) {
    // There isn't necessarily a DB unique constraint on title+contact_id, so we'll just insert.
    // If you wanted to skip duplicates you'd have to query first, or add a unique constraint.
    const { error } = await supabase.from('cases').insert(caseItem as never)
    if (error) {
      skipped++
      if (errors.length < 10) errors.push(`${(caseItem as { title: string }).title}: non importata.`)
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
