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

// Accepts flexible Italian/English header names for each case field.
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

  // Extract all unique fiscal codes to query contacts at once
  const fiscalCodes = new Set<string>()

  const tempParsed = rows.map((row, i) => {
    const lineNo = i + 2 // header is line 1
    const title = pick(row, ['titolo', 'title'])
    const type = pick(row, ['tipo', 'type']).toLowerCase()
    const status = pick(row, ['stato', 'status']).toLowerCase()
    const fiscalCode = pick(row, ['codice fiscale', 'codice_fiscale', 'fiscal_code', 'cf']).toUpperCase()
    const description = pick(row, ['descrizione', 'description'])

    if (!title || !type || !status || !fiscalCode) {
      errors.push(`Riga ${lineNo}: titolo, tipo, stato e codice fiscale sono obbligatori.`)
      return null
    }

    fiscalCodes.add(fiscalCode)
    return { title, type, status, fiscalCode, description, lineNo }
  }).filter(Boolean) as { title: string, type: string, status: string, fiscalCode: string, description: string, lineNo: number }[]

  if (tempParsed.length === 0) {
    return { ok: false, message: 'Nessuna riga valida da importare.', errors: errors.slice(0, 10) }
  }

  // Lookup contacts
  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, fiscal_code')
    .in('fiscal_code', Array.from(fiscalCodes))
    .eq('organization_id', profile.organization_id)

  const typedContacts = contacts as { id: string; fiscal_code: string }[] | null
  const contactMap = new Map((typedContacts || []).map(c => [c.fiscal_code, c.id]))

  tempParsed.forEach(({ title, type, status, fiscalCode, description, lineNo }) => {
    const contactId = contactMap.get(fiscalCode)
    if (!contactId) {
      errors.push(`Riga ${lineNo}: nessun contatto trovato con codice fiscale ${fiscalCode}.`)
      return
    }

    payload.push({
      title,
      type,
      status,
      description: description || null,
      contact_id: contactId,
      organization_id: profile.organization_id,
      assigned_to: user.id, // Assign to current user by default
    })
  })

  if (payload.length === 0) {
    return { ok: false, message: 'Nessuna riga valida da importare (controlla i codici fiscali).', errors: errors.slice(0, 10) }
  }

  let inserted = 0
  let skipped = 0

  // Note: For cases, there isn't a strict unique constraint on title/contact_id like there is for fiscal code in contacts.
  // We'll just insert them. If there's an error, we mark it skipped.
  const { data: insertedData, error: insertError } = await supabase
    .from('cases')
    .insert(payload as never[])
    .select('id')

  if (insertError) {
    // If bulk insert fails, fallback to individual inserts
    for (const caseItem of payload) {
      const { error } = await supabase.from('cases').insert(caseItem as never)
      if (error) {
        skipped++
        if (errors.length < 10) errors.push(`Errore importando la pratica "${caseItem.title}": ${error.message}`)
      } else {
        inserted++
      }
    }
  } else {
    inserted = insertedData?.length || 0
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
