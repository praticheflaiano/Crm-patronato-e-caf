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

  // extract all unique fiscal codes to fetch contacts in bulk
  const fiscalCodesToFetch = new Set<string>()

  rows.forEach((row, i) => {
    const lineNo = i + 2
    const title = pick(row, ['titolo', 'title'])
    const fiscalCode = pick(row, ['codice fiscale', 'codice_fiscale', 'fiscal_code', 'cf']).toUpperCase()

    if (!title || !fiscalCode) {
      errors.push(`Riga ${lineNo}: titolo e codice fiscale sono obbligatori.`)
      return
    }

    fiscalCodesToFetch.add(fiscalCode)
  })

  if (fiscalCodesToFetch.size === 0) {
     return { ok: false, message: 'Nessuna riga valida trovata o codici fiscali mancanti.', errors: errors.slice(0, 10) }
  }

  // Fetch contacts for these fiscal codes in the user's organization
  const { data: contacts, error: contactsError } = await supabase
    .from('contacts')
    .select('id, fiscal_code')
    .in('fiscal_code', Array.from(fiscalCodesToFetch))

  if (contactsError) {
     return { ok: false, message: 'Errore durante la verifica dei contatti.', errors: [contactsError.message] }
  }

  const contactMap = new Map<string, string>()
  if (contacts) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contacts.forEach((c: any) => {
      if (c && c.fiscal_code && c.id) {
        contactMap.set(c.fiscal_code as string, c.id as string)
      }
    })
  }

  const payload: Record<string, unknown>[] = []

  rows.forEach((row, i) => {
    const lineNo = i + 2 // header is line 1
    const title = pick(row, ['titolo', 'title'])
    const type = pick(row, ['tipo', 'type']) || 'caf'
    const status = pick(row, ['stato', 'status']) || 'new'
    const fiscalCode = pick(row, ['codice fiscale', 'codice_fiscale', 'fiscal_code', 'cf']).toUpperCase()
    const description = pick(row, ['descrizione', 'description'])

    if (!title || !fiscalCode) {
      // already handled in first pass
      return
    }

    const contactId = contactMap.get(fiscalCode)
    if (!contactId) {
      errors.push(`Riga ${lineNo}: nessun contatto trovato con codice fiscale ${fiscalCode}.`)
      return
    }

    payload.push({
      title,
      type,
      status,
      contact_id: contactId,
      description: description || null,
      organization_id: profile.organization_id,
      user_id: user.id,
    })
  })

  if (payload.length === 0) {
    return { ok: false, message: 'Nessuna riga valida da importare.', errors: errors.slice(0, 10) }
  }

  let inserted = 0
  let skipped = 0

  for (const item of payload) {
    const { error } = await supabase.from('cases').insert(item as never)
    if (error) {
      skipped++
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (errors.length < 10) errors.push(`Errore inserimento pratica "${(item as any).title}": ${error.message}`)
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
