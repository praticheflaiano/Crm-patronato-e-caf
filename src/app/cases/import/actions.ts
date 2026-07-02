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

  // Extract all fiscal codes to look up contact IDs
  const fiscalCodes = Array.from(new Set(
    rows.map(row => pick(row, ['codice fiscale', 'codice_fiscale', 'fiscal_code', 'cf', 'cliente_cf']).toUpperCase())
    .filter(Boolean)
  ))

  if (fiscalCodes.length === 0) {
    return { ok: false, message: 'Nessun codice fiscale trovato nel CSV.' }
  }

  // Fetch all matching contacts for this organization
  const { data: contacts, error: contactsError } = await supabase
    .from('contacts')
    .select('id, fiscal_code')
    .eq('organization_id', profile.organization_id)
    .in('fiscal_code', fiscalCodes)

  if (contactsError) {
    return { ok: false, message: 'Errore durante la verifica dei clienti.' }
  }

  const contactMap = new Map((contacts as { id: string; fiscal_code: string }[]).map(c => [c.fiscal_code, c.id]))

  const validTypes = ['caf', 'patronato', 'invalidita_civile', 'tari', 'other']
  const payload: Record<string, unknown>[] = []

  rows.forEach((row, i) => {
    const lineNo = i + 2 // header is line 1
    const title = pick(row, ['titolo', 'title'])
    const typeStr = pick(row, ['tipo', 'type']).toLowerCase()
    const type = validTypes.includes(typeStr) ? typeStr : 'other'
    const status = pick(row, ['stato', 'status']) || 'open'
    const fiscalCode = pick(row, ['codice fiscale', 'codice_fiscale', 'fiscal_code', 'cf', 'cliente_cf']).toUpperCase()

    if (!title || !fiscalCode) {
      errors.push(`Riga ${lineNo}: titolo e codice fiscale sono obbligatori.`)
      return
    }

    const contactId = contactMap.get(fiscalCode)
    if (!contactId) {
      errors.push(`Riga ${lineNo}: nessun cliente trovato con codice fiscale ${fiscalCode}.`)
      return
    }

    payload.push({
      title,
      type,
      status,
      contact_id: contactId,
      organization_id: profile.organization_id,
      created_by: user.id,
    })
  })

  if (payload.length === 0) {
    return { ok: false, message: 'Nessuna riga valida da importare.', errors: errors.slice(0, 10) }
  }

  const { data, error } = await supabase.from('cases').insert(payload as never).select('id')

  let inserted = 0
  let skipped = 0
  if (error) {
     return { ok: false, message: `Errore durante il salvataggio dei dati nel database. ${error.message}` }
  } else {
    inserted = (data as { id: string }[]).length;
    skipped = payload.length - inserted;
  }

  revalidatePath('/cases')
  return {
    ok: true,
    inserted,
    skipped,
    errors: errors.slice(0, 10),
    message: `Importate ${inserted} pratiche${skipped ? `, ${skipped} saltate/errate` : ''}.`,
  }
}
