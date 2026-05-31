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

// Admin-only: store the organization's OpenRouter API key and model. Values are
// written to the admin-only app_settings table (server-side); the key is never
// sent back to the client. Leaving the key field blank keeps the existing key
// (it is only cleared when "remove_key" is checked), so the model can be changed
// without re-entering the key.
export async function updateOpenRouterKey(formData: FormData): Promise<{ ok: boolean; message?: string }> {
  const rawKey = String(formData.get('openrouter_api_key') || '').trim()
  const removeKey = String(formData.get('remove_key') || '') === 'on'
  const rawModel = String(formData.get('openrouter_model') || '').trim()

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

  // Build the patch. Only touch the key when explicitly changed or removed, so
  // saving just a new model never wipes a previously stored key.
  const patch: Record<string, unknown> = {
    organization_id: profile.organization_id,
    openrouter_model: rawModel || null,
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  }
  if (removeKey) {
    patch.openrouter_api_key = null
  } else if (rawKey) {
    patch.openrouter_api_key = rawKey
  }

  const { error } = await supabase
    .from('app_settings')
    .upsert(patch as never, { onConflict: 'organization_id' })

  if (error) {
    return { ok: false, message: getSafeErrorMessage(error) }
  }

  revalidatePath('/settings')
  return { ok: true, message: 'Impostazioni assistente AI salvate.' }
}
