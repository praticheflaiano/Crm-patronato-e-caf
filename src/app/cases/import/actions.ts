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

  // To avoid duplicate lookups, map fiscal codes to contact_ids
  const fiscalCodesToLookup = new Set<string>()
  rows.forEach(row => {
      const fiscalCode = pick(row, ['codice fiscale', 'codice_fiscale', 'fiscal_code', 'cf']).toUpperCase()
      if (fiscalCode) {
          fiscalCodesToLookup.add(fiscalCode)
      }
  })

  const contactsMap = new Map<string, string>()
  if (fiscalCodesToLookup.size > 0) {
      const { data: contactsData, error: contactsError } = await supabase
          .from('contacts')
          .select('id, fiscal_code')
          .in('fiscal_code', Array.from(fiscalCodesToLookup))
          .eq('organization_id', profile.organization_id)

      if (!contactsError && contactsData) {
          contactsData.forEach((c: { id: string; fiscal_code: string }) => {
              contactsMap.set(c.fiscal_code, c.id)
          })
      }
  }

  const payload: Record<string, unknown>[] = []

  rows.forEach((row, i) => {
    const lineNo = i + 2 // header is line 1
    const title = pick(row, ['titolo', 'title'])
    let type = pick(row, ['tipo', 'type']).toLowerCase()
    let status = pick(row, ['stato', 'status']).toLowerCase()
    const fiscalCode = pick(row, ['codice fiscale', 'codice_fiscale', 'fiscal_code', 'cf']).toUpperCase()

    if (!title) {
      errors.push(`Riga ${lineNo}: titolo mancante.`)
      return
    }

    if (!fiscalCode) {
      errors.push(`Riga ${lineNo}: codice fiscale mancante.`)
      return
    }

    const contactId = contactsMap.get(fiscalCode)
    if (!contactId) {
      errors.push(`Riga ${lineNo}: cliente con codice fiscale ${fiscalCode} non trovato.`)
      return
    }

    const validTypes = ['caf', 'patronato', 'invalidita_civile', 'tari']
    if (!validTypes.includes(type)) {
       type = 'caf' // default
    }

    const validStatuses = ['aperta', 'in_attesa', 'completata', 'archiviata']
    if (!validStatuses.includes(status)) {
       status = 'aperta' // default
    }

    payload.push({
      title,
      type,
      status,
      contact_id: contactId,
      organization_id: profile.organization_id,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  })

  if (payload.length === 0) {
    return { ok: false, message: 'Nessuna riga valida da importare.', errors: errors.slice(0, 10) }
  }

  let inserted = 0
  let skipped = 0

  for (const caseItem of payload) {
      const { error } = await supabase.from('cases').insert(caseItem as never)
      if (error) {
        skipped++
        if (errors.length < 10) errors.push(`Errore inserimento pratica: ${error.message}`)
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
