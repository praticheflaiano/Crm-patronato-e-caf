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

// Accepts flexible Italian/English header names for each contact field.
function pick(row: Record<string, string>, keys: string[]): string {
  for (const k of keys) {
    if (row[k] != null && row[k] !== '') return row[k]
  }
  return ''
}

export async function importContacts(formData: FormData): Promise<ImportResult> {
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
  const seen = new Set<string>()
  const payload: Record<string, unknown>[] = []

  rows.forEach((row, i) => {
    const lineNo = i + 2 // header is line 1
    const firstName = pick(row, ['nome', 'first_name', 'firstname'])
    const lastName = pick(row, ['cognome', 'last_name', 'lastname'])
    const fiscalCode = pick(row, ['codice fiscale', 'codice_fiscale', 'fiscal_code', 'cf']).toUpperCase()
    const email = pick(row, ['email', 'e-mail'])
    const phone = pick(row, ['telefono', 'phone', 'cellulare'])
    const address = pick(row, ['indirizzo', 'address'])
    const dob = pick(row, ['data di nascita', 'data_nascita', 'date_of_birth', 'dob'])

    if (!firstName || !lastName || !fiscalCode) {
      errors.push(`Riga ${lineNo}: nome, cognome e codice fiscale sono obbligatori.`)
      return
    }
    if (seen.has(fiscalCode)) {
      errors.push(`Riga ${lineNo}: codice fiscale duplicato nel file (${fiscalCode}).`)
      return
    }
    seen.add(fiscalCode)

    payload.push({
      first_name: firstName,
      last_name: lastName,
      fiscal_code: fiscalCode,
      email: email || null,
      phone: phone || null,
      address: address || null,
      date_of_birth: /^\d{4}-\d{2}-\d{2}$/.test(dob) ? dob : null,
      organization_id: profile.organization_id,
      user_id: user.id,
    })
  })

  if (payload.length === 0) {
    return { ok: false, message: 'Nessuna riga valida da importare.', errors: errors.slice(0, 10) }
  }

  // Insert and skip rows whose fiscal code already exists (unique constraint).
  let inserted = 0
  let skipped = 0
  for (const contact of payload) {
    const { error } = await supabase.from('contacts').insert(contact as never)
    if (error) {
      skipped++
      if (errors.length < 10) errors.push(`${(contact as { fiscal_code: string }).fiscal_code}: ${error.code === '23505' ? 'già presente' : 'non importato'}.`)
    } else {
      inserted++
    }
  }

  revalidatePath('/contacts')
  return {
    ok: true,
    inserted,
    skipped,
    errors: errors.slice(0, 10),
    message: `Importati ${inserted} contatti${skipped ? `, ${skipped} saltati` : ''}.`,
  }
}
