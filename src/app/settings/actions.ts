'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

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
