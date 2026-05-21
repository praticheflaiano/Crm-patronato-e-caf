'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function createTask(formData: FormData) {
  const caseId = formData.get('caseId') as string
  const title = formData.get('title') as string

  if (!caseId || !title) {
    return { ok: false, message: 'Dati mancanti.' }
  }

  const supabase = await createClient()

  // Verify auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { ok: false, message: 'Non autenticato.' }
  }

  // Get user profile for organization_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
     return { ok: false, message: 'Profilo non trovato.' }
  }

  const userProfile = profile as any /* eslint-disable-line @typescript-eslint/no-explicit-any */

  const { error } = await supabase.from('tasks').insert({
    case_id: caseId,
    title,
    organization_id: userProfile.organization_id
  } as any /* eslint-disable-line @typescript-eslint/no-explicit-any */)

  if (error) {
    return { ok: false, message: `Errore durante la creazione del task: ${error.message}` }
  }

  revalidatePath(`/cases/${caseId}`)
  return { ok: true, message: 'Task creato con successo.' }
}

export async function toggleTask(taskId: string, caseId: string, isCompleted: boolean) {
  const supabase = await createClient()

  // Verify auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { ok: false, message: 'Non autenticato.' }
  }

  // Get user profile for organization_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
     return { ok: false, message: 'Profilo non trovato.' }
  }

  const userProfile = profile as any /* eslint-disable-line @typescript-eslint/no-explicit-any */

  const { error } = await (supabase as any /* eslint-disable-line @typescript-eslint/no-explicit-any */)
    .from('tasks')
    .update({ is_completed: isCompleted })
    .eq('id', taskId)
    .eq('organization_id', userProfile.organization_id) // Secure the update

  if (error) {
    return { ok: false, message: `Errore durante l'aggiornamento del task: ${error.message}` }
  }

  revalidatePath(`/cases/${caseId}`)
  return { ok: true }
}
