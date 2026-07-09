'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { getOrCreateUserProfile } from '@/lib/user-profile'
import { parseCsv } from '@/lib/csv'
import { CASE_TYPES } from '@/lib/case-workflow'

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
  const organizationId = profile.organization_id

  const rows = parseCsv(await file.text())
  if (rows.length === 0) {
    return { ok: false, message: 'Il CSV è vuoto o non ha intestazioni valide.' }
  }
  if (rows.length > 2000) {
    return { ok: false, message: 'Troppe righe (max 2000 per import).' }
  }

  // Pre-fetch all contacts for the organization to link cases by fiscal_code
  const { data: contactsData, error: contactsError } = await supabase
    .from('contacts')
    .select('id, fiscal_code')

  if (contactsError) {
    return { ok: false, message: 'Errore durante il recupero dei contatti per l\'associazione.' }
  }

  // Map fiscal codes to contact IDs for quick lookup
  const contactMap = new Map<string, string>()
  if (contactsData) {
    for (const contact of contactsData as { id: string, fiscal_code: string | null }[]) {
      if (contact.fiscal_code) {
        contactMap.set(contact.fiscal_code.toUpperCase(), contact.id)
      }
    }
  }

  const errors: string[] = []
  const payload: Record<string, unknown>[] = []

  rows.forEach((row, i) => {
    const lineNo = i + 2 // header is line 1
    const title = pick(row, ['titolo', 'title'])
    const typeStr = pick(row, ['tipo', 'type', 'case_type']).toLowerCase()
    const description = pick(row, ['descrizione', 'description', 'note'])
    const fiscalCode = pick(row, ['codice fiscale', 'codice_fiscale', 'fiscal_code', 'cf']).toUpperCase()

    if (!title || !typeStr || !fiscalCode) {
      errors.push(`Riga ${lineNo}: titolo, tipo e codice fiscale sono obbligatori.`)
      return
    }

    // Validate case type
    let type = typeStr
    if (!CASE_TYPES.includes(type as "caf" | "patronato" | "invalidita_civile" | "tari")) {
      // Basic fallback/mapping
      if (typeStr.includes('invalidit')) type = 'invalidita_civile'
      else if (typeStr.includes('tari')) type = 'tari'
      else if (typeStr.includes('caf')) type = 'caf'
      else if (typeStr.includes('patronato')) type = 'patronato'
      else {
        errors.push(`Riga ${lineNo}: tipo pratica non riconosciuto (${typeStr}). Usare: caf, patronato, invalidita_civile, tari.`)
        return
      }
    }

    const contactId = contactMap.get(fiscalCode)
    if (!contactId) {
      errors.push(`Riga ${lineNo}: nessun contatto trovato per il codice fiscale ${fiscalCode}. La pratica sarà creata senza cliente associato.`)
      // Non ritorniamo qui, permettiamo la creazione della pratica anche senza contatto per evitare di bloccare l'import
    }

    payload.push({
      title,
      type,
      description: description || null,
      status: 'open', // Default status mapping to CaseStatus enum
      contact_id: contactId || null,
      organization_id: organizationId,
      created_by: user.id,
      // Default empty metadata
      metadata: {},
    })
  })

  if (payload.length === 0) {
    return { ok: false, message: 'Nessuna riga valida da importare.', errors: errors.slice(0, 10) }
  }

  // Insert rows
  let inserted = 0
  let skipped = 0
  for (const caseRecord of payload) {
    const { error } = await supabase.from('cases').insert(caseRecord as never)
    if (error) {
      skipped++
      const title = String(caseRecord.title ?? 'Senza titolo')
      if (errors.length < 10) errors.push(`Errore salvataggio pratica '${title}': ${error.message}`)
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
    message: `Importate ${inserted} pratiche${skipped ? `, ${skipped} fallite` : ''}.`,
  }
}
