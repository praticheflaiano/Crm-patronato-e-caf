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

  // Pre-fetch contacts to map fiscal code to contact_id
  const fiscalCodesToFetch = Array.from(new Set(rows.map(row => pick(row, ['codice fiscale', 'codice_fiscale', 'fiscal_code', 'cf']).toUpperCase()).filter(Boolean)))

  let contactMap = new Map<string, string>()

  if (fiscalCodesToFetch.length > 0) {
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, fiscal_code')
      .in('fiscal_code', fiscalCodesToFetch)
      .eq('organization_id', profile.organization_id)

    if (contactsError) {
      return { ok: false, message: `Errore durante il recupero dei contatti: ${contactsError.message}` }
    }

    if (contacts) {
      const typedContacts = contacts as { id: string; fiscal_code: string }[]
      contactMap = new Map(typedContacts.map(c => [c.fiscal_code, c.id]))
    }
  }

  rows.forEach((row, i) => {
    const lineNo = i + 2 // header is line 1
    const title = pick(row, ['titolo', 'title', 'nome pratica'])
    const type = pick(row, ['tipo', 'type', 'tipologia'])
    const status = pick(row, ['stato', 'status'])
    const fiscalCode = pick(row, ['codice fiscale', 'codice_fiscale', 'fiscal_code', 'cf']).toUpperCase()

    if (!title || !type || !status || !fiscalCode) {
      errors.push(`Riga ${lineNo}: titolo, tipo, stato e codice fiscale sono obbligatori.`)
      return
    }

    const contactId = contactMap.get(fiscalCode)

    if (!contactId) {
      errors.push(`Riga ${lineNo}: nessun contatto trovato con codice fiscale ${fiscalCode}.`)
      return
    }

    // Mapping case type string to enum equivalent if needed
    let mappedType = type.toLowerCase()
    if (!['caf', 'patronato', 'invalidita_civile', 'tari', 'colf_badanti'].includes(mappedType)) {
      mappedType = 'caf' // default or could trigger an error, mapping to caf for fallback
    }

    payload.push({
      title,
      type: mappedType,
      status: status.toLowerCase().replace(/\s+/g, '_'),
      contact_id: contactId,
      organization_id: profile.organization_id,
      user_id: user.id,
    })
  })

  if (payload.length === 0) {
    return { ok: false, message: 'Nessuna riga valida da importare.', errors: errors.slice(0, 10) }
  }

  let inserted = 0
  let skipped = 0

  // Perform bulk insert for better performance on large files
  const { data, error } = await supabase.from('cases').insert(payload as never[]).select('id')

  if (error) {
    // If the bulk insert fails entirely, we report it.
    skipped = payload.length
    errors.push(`Errore nel salvataggio in blocco: ${error.message}`)
  } else {
    // Assuming DO NOTHING is not heavily used since there's no unique constraint
    inserted = data ? data.length : payload.length
  }

  revalidatePath('/cases')
  return {
    ok: true,
    inserted,
    skipped,
    errors: errors.slice(0, 10),
    message: `Importate ${inserted} pratiche${skipped ? `, ${skipped} fallite` : ''}.`,
  }
}
