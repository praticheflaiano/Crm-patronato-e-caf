'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { getOrCreateUserProfile } from '@/lib/user-profile'
import { getSafeErrorMessage } from '@/lib/supabase-errors'

export async function updateProfile(formData: FormData): Promise<{ ok: boolean; message?: string }> {
  const full_name = String(formData.get('full_name') || '').trim()

  if (!full_name) {
    return { ok: false, message: 'Il nome non può essere vuoto.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, message: 'Accesso richiesto.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ full_name } as never)
    .eq('id', user.id)

  if (error) {
    return { ok: false, message: 'Salvataggio non riuscito.' }
  }

  revalidatePath('/settings')
  return { ok: true }
}

// Admin-only: store the organization's OpenRouter API key. The value is written
// to the admin-only app_settings table (server-side); it is never sent back to
// the client. An empty value clears the key (falls back to the env var).
export async function updateOpenRouterKey(formData: FormData): Promise<{ ok: boolean; message?: string }> {
  const rawKey = String(formData.get('openrouter_api_key') || '').trim()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, message: 'Accesso richiesto.' }
  }

  const profile = await getOrCreateUserProfile(user)
  if (!profile || profile.role !== 'admin' || !profile.organization_id) {
    return { ok: false, message: 'Permessi insufficienti.' }
  }

  const { error } = await supabase
    .from('app_settings')
    .upsert(
      {
        organization_id: profile.organization_id,
        openrouter_api_key: rawKey || null,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      } as never,
      { onConflict: 'organization_id' }
    )

  if (error) {
    return { ok: false, message: getSafeErrorMessage(error) }
  }

  revalidatePath('/settings')
  return { ok: true, message: rawKey ? 'Chiave OpenRouter salvata.' : 'Chiave OpenRouter rimossa.' }
}
