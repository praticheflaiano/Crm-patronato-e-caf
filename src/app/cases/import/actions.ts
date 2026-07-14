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
  let inserted = 0
  let skipped = 0

  // Optimize: Fetch all contacts for this organization once
  const { data: contactsData } = await supabase
    .from('contacts')
    .select('id, fiscal_code')
    .eq('organization_id', profile.organization_id)

  const contactMap = new Map<string, string>()
  const contacts = contactsData as { id: string; fiscal_code: string }[] | null
  if (contacts) {
    contacts.forEach(c => {
      contactMap.set(c.fiscal_code, c.id)
    })
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const lineNo = i + 2

    const title = pick(row, ['titolo', 'title', 'nome pratica', 'pratica'])
    const cf = pick(row, ['codice fiscale contatto', 'codice_fiscale', 'cf', 'fiscal_code']).toUpperCase()
    const typeStr = pick(row, ['tipo', 'type', 'categoria']).toLowerCase()
    const statusStr = pick(row, ['stato', 'status']).toLowerCase()
    const desc = pick(row, ['descrizione', 'description', 'note'])

    if (!title || !cf) {
      errors.push(`Riga ${lineNo}: titolo e codice fiscale contatto sono obbligatori.`)
      skipped++
      continue
    }

    const contactId = contactMap.get(cf)
    if (!contactId) {
      errors.push(`Riga ${lineNo}: nessun contatto trovato con codice fiscale ${cf}.`)
      skipped++
      continue
    }

    // Default mapping for case_type
    let type = 'patronato'
    if (typeStr.includes('caf')) type = 'caf'
    if (typeStr.includes('invalidit')) type = 'invalidita_civile'
    if (typeStr.includes('tari')) type = 'tari'

    // Default mapping for status
    let status = 'open'
    if (statusStr.includes('progress') || statusStr.includes('corso') || statusStr.includes('lavorazione')) status = 'in_progress'
    if (statusStr.includes('wait') || statusStr.includes('attes') || statusStr.includes('sospes')) status = 'waiting'
    if (statusStr.includes('done') || statusStr.includes('complet') || statusStr.includes('chius')) status = 'completed'
    if (statusStr.includes('reject') || statusStr.includes('rifiut') || statusStr.includes('scartat')) status = 'rejected'

    const { error } = await supabase.from('cases').insert({
      title,
      contact_id: contactId,
      case_type: type as "caf" | "patronato" | "invalidita_civile" | "tari",
      status: status as "open" | "in_progress" | "waiting" | "completed" | "rejected",
      description: desc || null,
      organization_id: profile.organization_id,
      assigned_to: user.id
    } as never)

    if (error) {
      if (errors.length < 10) errors.push(`Riga ${lineNo} (${title}): errore inserimento (${error.message}).`)
      skipped++
    } else {
      inserted++
    }
  }

  revalidatePath('/cases')
  return {
    ok: inserted > 0 || errors.length === 0,
    inserted,
    skipped,
    errors: errors.slice(0, 10),
    message: `Importate ${inserted} pratiche${skipped ? `, ${skipped} saltate` : ''}.`,
  }
}
