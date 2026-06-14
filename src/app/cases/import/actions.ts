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

const VALID_TYPES = ['caf', 'patronato', 'invalidita_civile', 'tari']
const VALID_STATUSES = ['open', 'in_progress', 'pending_documents', 'completed', 'rejected']

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

  // Optimize contact lookup by loading all contacts for the organization
  const { data: contactsData, error: contactsError } = await supabase
    .from('contacts')
    .select('id, fiscal_code')
    .eq('organization_id', profile.organization_id)

  if (contactsError) {
    return { ok: false, message: 'Errore nel recupero dei contatti.' }
  }

  const contactMap = new Map<string, string>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(contactsData as any[])?.forEach((c) => contactMap.set(c.fiscal_code, c.id))

  const errors: string[] = []
  const payload: Record<string, unknown>[] = []

  rows.forEach((row, i) => {
    const lineNo = i + 2
    const title = pick(row, ['titolo', 'title'])
    const fiscalCode = pick(row, ['codice fiscale', 'codice_fiscale', 'fiscal_code', 'cf']).toUpperCase()
    const rawType = pick(row, ['tipo', 'type']).toLowerCase()
    const rawStatus = pick(row, ['stato', 'status']).toLowerCase()
    const description = pick(row, ['descrizione', 'description'])

    if (!title || !fiscalCode || !rawType) {
      errors.push(`Riga ${lineNo}: titolo, codice fiscale e tipo sono obbligatori.`)
      return
    }

    if (!VALID_TYPES.includes(rawType)) {
      errors.push(`Riga ${lineNo}: tipo '${rawType}' non valido.`)
      return
    }

    const type = rawType
    const status = VALID_STATUSES.includes(rawStatus) ? rawStatus : 'open'

    const contactId = contactMap.get(fiscalCode)
    if (!contactId) {
      errors.push(`Riga ${lineNo}: nessun contatto trovato con CF ${fiscalCode}.`)
      return
    }

    payload.push({
      title,
      type,
      status,
      description: description || null,
      contact_id: contactId,
      organization_id: profile.organization_id,
      assigned_to: user.id, // Assign to the user importing the data
    })
  })

  if (payload.length === 0) {
    return { ok: false, message: 'Nessuna riga valida da importare.', errors: errors.slice(0, 10) }
  }

  // Insert rows
  let inserted = 0
  let skipped = 0

  for (const caseObj of payload) {
    const { error } = await supabase.from('cases').insert(caseObj as never)
    if (error) {
      skipped++
      if (errors.length < 10) errors.push(`Errore importazione riga: ${error.message}`)
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
