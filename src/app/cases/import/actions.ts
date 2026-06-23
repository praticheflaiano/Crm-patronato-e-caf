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

  // To link cases to contacts by fiscal code
  const fiscalCodesToFetch = Array.from(new Set(rows.map(row => pick(row, ['codice fiscale', 'codice_fiscale', 'fiscal_code', 'cf']).toUpperCase()).filter(Boolean)))

  const contactMap: Record<string, string> = {}

  if (fiscalCodesToFetch.length > 0) {
    const { data: contactsData, error } = await supabase
      .from('contacts')
      .select('id, fiscal_code')
      .eq('organization_id', profile.organization_id)
      .in('fiscal_code', fiscalCodesToFetch)

    if (error) {
       return { ok: false, message: 'Errore durante la ricerca dei contatti.' }
    }

    if (contactsData) {
      const contacts = contactsData as unknown as {id: string, fiscal_code: string}[]
    contacts.forEach(contact => {
        contactMap[contact.fiscal_code] = contact.id
      })
    }
  }

  const payload: Record<string, unknown>[] = []

  rows.forEach((row, i) => {
    const lineNo = i + 2 // header is line 1
    const title = pick(row, ['titolo', 'title'])
    const type = pick(row, ['tipo', 'type'])
    const status = pick(row, ['stato', 'status'])
    const description = pick(row, ['descrizione', 'description'])
    const fiscalCode = pick(row, ['codice fiscale', 'codice_fiscale', 'fiscal_code', 'cf']).toUpperCase()

    if (!title || !type || !status || !fiscalCode) {
      errors.push(`Riga ${lineNo}: titolo, tipo, stato e codice fiscale sono obbligatori.`)
      return
    }

    const contactId = contactMap[fiscalCode]

    if (!contactId) {
      errors.push(`Riga ${lineNo}: Nessun cliente trovato con codice fiscale (${fiscalCode}).`)
      return
    }

    payload.push({
      title,
      type,
      status,
      description: description || null,
      contact_id: contactId,
      organization_id: profile.organization_id,
      assigned_to: user.id, // Assign to the current user
    })
  })

  if (payload.length === 0) {
    return { ok: false, message: 'Nessuna riga valida da importare.', errors: errors.slice(0, 10) }
  }

  // Insert rows
  let inserted = 0
  let skipped = 0
  for (const caseData of payload) {
    const { error } = await supabase.from('cases').insert(caseData as never)
    if (error) {
      skipped++
      if (errors.length < 10) errors.push(`Errore inserimento pratica "${(caseData as {title: string}).title}": ${error.message}.`)
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
