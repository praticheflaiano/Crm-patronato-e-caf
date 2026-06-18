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

  // Pre-fetch contacts to map fiscal_code to contact_id
  const fiscalCodesToLookup = new Set<string>()
  rows.forEach(row => {
      const fiscalCode = pick(row, ['codice fiscale', 'codice_fiscale', 'fiscal_code', 'cf', 'cliente']).toUpperCase()
      if (fiscalCode) fiscalCodesToLookup.add(fiscalCode)
  })

  // To avoid too many parameters in the query, we could chunk it, but for 2000 rows, usually it's fine.
  // Actually, we can fetch all contacts for the organization to be safe, or just the ones needed.
  const { data: contactsData, error: contactsError } = await supabase
    .from('contacts')
    .select('id, fiscal_code')
    .eq('organization_id', profile.organization_id)

  if (contactsError) {
      return { ok: false, message: 'Errore nel caricamento dei contatti per la validazione.' }
  }

  const contactMap = new Map<string, string>()
  if (contactsData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      contactsData.forEach((c: any) => contactMap.set(c.fiscal_code.toUpperCase(), c.id))
  }

  rows.forEach((row, i) => {
    const lineNo = i + 2 // header is line 1
    const title = pick(row, ['titolo', 'title', 'nome pratica'])
    const rawFiscalCode = pick(row, ['codice fiscale', 'codice_fiscale', 'fiscal_code', 'cf', 'cliente'])
    const fiscalCode = rawFiscalCode.toUpperCase()
    const description = pick(row, ['descrizione', 'description', 'note'])
    const rawType = pick(row, ['tipo', 'type']).toLowerCase()
    const rawStatus = pick(row, ['stato', 'status']).toLowerCase()

    if (!title || !fiscalCode) {
      errors.push(`Riga ${lineNo}: titolo e codice fiscale sono obbligatori.`)
      return
    }

    const contactId = contactMap.get(fiscalCode)
    if (!contactId) {
        errors.push(`Riga ${lineNo}: contatto con codice fiscale ${fiscalCode} non trovato.`)
        return
    }

    let type = 'caf'
    if (['patronato'].includes(rawType)) type = 'patronato'
    else if (['invalidita_civile', 'invalidita civile', 'invalidità civile', 'invalidita'].includes(rawType)) type = 'invalidita_civile'
    else if (['tari'].includes(rawType)) type = 'tari'

    let status = 'open'
    if (['in_progress', 'in lavorazione', 'in corso'].includes(rawStatus)) status = 'in_progress'
    else if (['pending_documents', 'in attesa di documenti', 'attesa documenti'].includes(rawStatus)) status = 'pending_documents'
    else if (['completed', 'completata', 'conclusa'].includes(rawStatus)) status = 'completed'
    else if (['rejected', 'rifiutata', 'annullata'].includes(rawStatus)) status = 'rejected'


    payload.push({
      title,
      description: description || null,
      type,
      status,
      contact_id: contactId,
      organization_id: profile.organization_id,
      assigned_to: user.id,
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
      if (errors.length < 10) errors.push(`Impossibile importare: ${error.message}.`)
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
