'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { getOrCreateUserProfile } from '@/lib/user-profile'
import { parseCsv } from '@/lib/csv'
import { CASE_TYPES, CASE_STATUSES } from '@/lib/case-workflow'

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

  // Pre-fetch all contacts for this organization to match by fiscal code
  const { data: contactsData, error: contactsError } = await supabase
    .from('contacts')
    .select('id, fiscal_code')
    .eq('organization_id', profile.organization_id)

  if (contactsError) {
    return { ok: false, message: 'Errore nel recupero dei contatti.' }
  }

  const contactMap = new Map<string, string>()
  const typedContactsData = contactsData as { id: string, fiscal_code: string }[] | null
  typedContactsData?.forEach(c => contactMap.set(c.fiscal_code.toUpperCase(), c.id))

  const errors: string[] = []
  const payload: Record<string, unknown>[] = []

  rows.forEach((row, i) => {
    const lineNo = i + 2 // header is line 1
    const title = pick(row, ['titolo', 'title'])
    const description = pick(row, ['descrizione', 'description'])
    const fiscalCodeRaw = pick(row, ['codice fiscale', 'codice_fiscale', 'fiscal_code', 'cf'])
    const typeRaw = pick(row, ['tipo', 'type'])
    const statusRaw = pick(row, ['stato', 'status'])

    if (!title) {
      errors.push(`Riga ${lineNo}: titolo mancante.`)
      return
    }

    let contactId = null
    if (fiscalCodeRaw) {
      const fc = fiscalCodeRaw.toUpperCase()
      contactId = contactMap.get(fc)
      if (!contactId) {
        errors.push(`Riga ${lineNo}: contatto con codice fiscale ${fc} non trovato.`)
        return
      }
    }

    // Default values if not valid
    let type = 'caf'
    if (CASE_TYPES.includes(typeRaw as never)) {
      type = typeRaw
    }

    let status = 'open'
    if (CASE_STATUSES.includes(statusRaw as never)) {
      status = statusRaw
    }

    payload.push({
      title,
      description: description || null,
      type,
      status,
      contact_id: contactId,
      organization_id: profile.organization_id,
      user_id: user.id,
    })
  })

  if (payload.length === 0) {
    return { ok: false, message: 'Nessuna riga valida da importare.', errors: errors.slice(0, 10) }
  }

  // Insert rows
  let inserted = 0
  let skipped = 0
  for (const caseItem of payload) {
    const { error } = await supabase.from('cases').insert(caseItem as never)
    if (error) {
      skipped++
      if (errors.length < 10) errors.push(`Errore inserimento pratica "${caseItem.title}": ${error.message}`)
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
