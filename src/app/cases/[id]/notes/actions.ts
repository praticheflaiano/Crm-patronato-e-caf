'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createNote(caseId: string, content: string) {
  const supabase = await createClient()

  // Ottieni il profilo corrente per l'organization_id e l'author_id
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
    .from('case_notes')
    .insert({
      case_id: caseId,
      content: content,
      author_id: user.id,
      organization_id: profile.organization_id
    } as any)

  if (error) {
    console.error('Error creating note:', error)
    return { error: 'Impossibile creare la nota' }
  }

  revalidatePath(`/cases/${caseId}`)
  return { success: true }
}
