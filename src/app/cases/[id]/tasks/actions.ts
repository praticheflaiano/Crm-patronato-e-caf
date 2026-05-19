'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createTask(caseId: string, title: string) {
  const supabase = await createClient()

  // Ottieni il profilo corrente per l'organization_id
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Non autorizzato' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single<{ organization_id: string }>()

  if (!profile?.organization_id) {
    return { error: 'Organizzazione non trovata' }
  }

  const { error } = await supabase
    .from('tasks')
    .insert({
      case_id: caseId,
      title: title,
      organization_id: profile.organization_id
    } as any)

  if (error) {
    console.error('Error creating task:', error)
    return { error: 'Impossibile creare il task' }
  }

  revalidatePath(`/cases/${caseId}`)
  return { success: true }
}

export async function toggleTask(taskId: string, isCompleted: boolean, caseId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tasks')
    .update({ is_completed: isCompleted } as never)
    .eq('id' as never, taskId as never)

  if (error) {
    console.error('Error toggling task:', error)
    return { error: 'Impossibile aggiornare il task' }
  }

  revalidatePath(`/cases/${caseId}`)
  return { success: true }
}
