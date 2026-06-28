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

// Accepts flexible Italian/English header names for each field.
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

  // First, extract all unique fiscal codes to fetch contact IDs in bulk
  const fiscalCodes = Array.from(new Set(rows.map(row =>
    pick(row, ['codice fiscale', 'codice_fiscale', 'fiscal_code', 'cf', 'cliente']).toUpperCase()
  ).filter(Boolean)))

  // Fetch contacts for the organization
  const { data: contactsData } = await supabase
    .from('contacts')
    .select('id, fiscal_code')
    .eq('organization_id', profile.organization_id)
    .in('fiscal_code', fiscalCodes)

  const contactMap = new Map<string, string>()
  if (contactsData) {
    for (const contact of contactsData as { id: string; fiscal_code: string }[]) {
      contactMap.set(contact.fiscal_code, contact.id)
    }
  }

  const payload: Record<string, unknown>[] = []
  const uniqueKeys = new Set<string>()

  rows.forEach((row, i) => {
    const lineNo = i + 2 // header is line 1
    const title = pick(row, ['titolo', 'title'])
    const typeRaw = pick(row, ['tipo', 'type', 'case_type']).toLowerCase()
    const fiscalCode = pick(row, ['codice fiscale', 'codice_fiscale', 'fiscal_code', 'cf', 'cliente']).toUpperCase()
    const description = pick(row, ['descrizione', 'description'])
    const statusRaw = pick(row, ['stato', 'status', 'case_status']).toLowerCase()

    if (!title || !typeRaw || !fiscalCode) {
      errors.push(`Riga ${lineNo}: titolo, tipo e codice fiscale sono obbligatori.`)
      return
    }

    // Normalize type
    let type = 'caf'
    if (['patronato'].includes(typeRaw)) type = 'patronato'
    else if (['invalidita_civile', 'invalidita', 'invalidità', 'invalidità civile', 'invalidita civile'].includes(typeRaw)) type = 'invalidita_civile'
    else if (['tari'].includes(typeRaw)) type = 'tari'

    // Normalize status
    let status = 'open'
    if (['in_progress', 'in progress', 'in lavorazione', 'in corso'].includes(statusRaw)) status = 'in_progress'
    else if (['pending_documents', 'pending documents', 'in attesa', 'documenti mancanti', 'attesa documenti'].includes(statusRaw)) status = 'pending_documents'
    else if (['completed', 'completata', 'conclusa', 'terminata'].includes(statusRaw)) status = 'completed'
    else if (['rejected', 'rifiutata', 'respinta', 'annullata'].includes(statusRaw)) status = 'rejected'

    const contactId = contactMap.get(fiscalCode)

    if (!contactId) {
      errors.push(`Riga ${lineNo}: cliente con codice fiscale ${fiscalCode} non trovato.`)
      return
    }

    // Basic deduplication in memory based on title + contact to avoid inserting exact duplicates in the same run
    const uniqueKey = `${title.toLowerCase()}-${contactId}`
    if (uniqueKeys.has(uniqueKey)) {
      errors.push(`Riga ${lineNo}: pratica duplicata nel file.`)
      return
    }
    uniqueKeys.add(uniqueKey)

    payload.push({
      title,
      type,
      status,
      description: description || null,
      contact_id: contactId,
      organization_id: profile.organization_id,
    })
  })

  if (payload.length === 0) {
    return { ok: false, message: 'Nessuna riga valida da importare.', errors: errors.slice(0, 10) }
  }

  // Insert sequentially to track errors per row
  let inserted = 0
  let skipped = 0

  for (const caseData of payload) {
    const { error } = await supabase.from('cases').insert(caseData as never)
    if (error) {
      skipped++
      if (errors.length < 10) {
        errors.push(`Errore inserimento pratica "${(caseData as { title: string }).title}": ${error.message}`)
      }
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
