'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { getOrCreateUserProfile } from '@/lib/user-profile'
import { parseCsv } from '@/lib/csv'
import { CASE_TYPES, CASE_STATUSES, type CaseType, type CaseStatus } from '@/lib/case-workflow'

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

  // Pre-fetch contacts to map fiscal code to contact ID
  const fiscalCodes = new Set<string>()
  rows.forEach(row => {
    const fc = pick(row, ['codice fiscale', 'codice_fiscale', 'fiscal_code', 'cf']).toUpperCase()
    if (fc) fiscalCodes.add(fc)
  })

  let contactsMap: Record<string, string> = {}
  if (fiscalCodes.size > 0) {
    const { data: contactsData } = await supabase
      .from('contacts')
      .select('id, fiscal_code')
      .eq('organization_id', profile.organization_id)
      .in('fiscal_code', Array.from(fiscalCodes))

    if (contactsData) {
      contactsMap = contactsData.reduce((acc, c: {id: string, fiscal_code: string | null}) => {
        if (c.fiscal_code) acc[c.fiscal_code] = c.id
        return acc
      }, {} as Record<string, string>)
    }
  }

  rows.forEach((row, i) => {
    const lineNo = i + 2 // header is line 1
    const title = pick(row, ['titolo', 'title'])
    const description = pick(row, ['descrizione', 'description'])
    let type = pick(row, ['tipo', 'type']).toLowerCase() as CaseType
    let status = pick(row, ['stato', 'status']).toLowerCase() as CaseStatus
    const fiscalCode = pick(row, ['codice fiscale', 'codice_fiscale', 'fiscal_code', 'cf']).toUpperCase()

    if (!title) {
      errors.push(`Riga ${lineNo}: Il titolo è obbligatorio.`)
      return
    }

    if (!type || !CASE_TYPES.includes(type)) {
      type = 'caf' // default
    }

    if (!status || !CASE_STATUSES.includes(status)) {
      status = 'open' // default
    }

    const contactId = fiscalCode ? contactsMap[fiscalCode] : null

    if (fiscalCode && !contactId) {
      errors.push(`Riga ${lineNo}: Nessun contatto trovato con codice fiscale ${fiscalCode}.`)
      return
    }

    payload.push({
      title,
      description: description || null,
      type,
      status,
      contact_id: contactId,
      organization_id: profile.organization_id,
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
