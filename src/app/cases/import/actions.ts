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
  const fiscalCodes = Array.from(new Set(rows.map(r => pick(r, ['codice fiscale', 'codice_fiscale', 'fiscal_code', 'cf']).toUpperCase()).filter(Boolean)))

  const { data: contactsData } = await supabase
    .from('contacts')
    .select('id, fiscal_code')
    .in('fiscal_code', fiscalCodes)
    .eq('organization_id', profile.organization_id)

  const typedContacts = (contactsData || []) as { id: string; fiscal_code: string }[]
  const contactMap = new Map(typedContacts.map(c => [c.fiscal_code, c.id]))

  rows.forEach((row, i) => {
    const lineNo = i + 2 // header is line 1
    const fiscalCode = pick(row, ['codice fiscale', 'codice_fiscale', 'fiscal_code', 'cf']).toUpperCase()
    const type = pick(row, ['tipo', 'type'])
    const status = pick(row, ['stato', 'status'])
    const identifier = pick(row, ['identificativo', 'identifier', 'numero', 'protocollo'])

    if (!fiscalCode || !type || !status) {
      errors.push(`Riga ${lineNo}: codice fiscale, tipo e stato sono obbligatori.`)
      return
    }

    const contactId = contactMap.get(fiscalCode)
    if (!contactId) {
      errors.push(`Riga ${lineNo}: nessun contatto trovato con codice fiscale ${fiscalCode}.`)
      return
    }

    payload.push({
      contact_id: contactId,
      type: type,
      status: status,
      identifier: identifier || null,
      organization_id: profile.organization_id,
      assigned_to: user.id,
    })
  })

  if (payload.length === 0) {
    return { ok: false, message: 'Nessuna riga valida da importare.', errors: errors.slice(0, 10) }
  }

  let inserted = 0
  let skipped = 0
  for (const caseData of payload) {
    // If identifier is present, we could check for duplicates, but cases don't strictly have a unique identifier in the same way contacts have a fiscal code unless we use the identifier column.
    // For simplicity, we just insert. If it fails, we catch it.
    const { error } = await supabase.from('cases').insert(caseData as never)
    if (error) {
      skipped++
      if (errors.length < 10) errors.push(`Errore per contatto ID ${(caseData as { contact_id?: string }).contact_id ?? 'sconosciuto'}: ${error.message}`)
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
