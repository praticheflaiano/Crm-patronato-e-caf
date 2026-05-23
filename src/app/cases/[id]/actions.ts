'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getOrCreateUserProfile } from '@/lib/user-profile'
import type { CaseStatus } from '@/lib/case-workflow'

export async function updateCaseStatus(formData: FormData) {
  const id = String(formData.get('id') || '')
  const status = String(formData.get('status') || '') as CaseStatus
  if (!id || !status) redirect('/cases')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getOrCreateUserProfile(user)

  const { error } = await supabase
    .from('cases')
    .update({ status, updated_at: new Date().toISOString() } as never)
    .eq('id', id)

  if (error) redirect('/error')

  if (status === 'pending_documents' && profile?.organization_id) {
    await supabase.from('tasks').insert({
      case_id: id,
      title: 'Sollecitare documenti mancanti',
      description: 'Contattare il cittadino e registrare quali documenti mancano per sbloccare la pratica.',
      due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      assigned_to: user.id,
      organization_id: profile.organization_id,
      is_completed: false,
    } as never)
  }

  revalidatePath('/cases')
  revalidatePath(`/cases/${id}`)
  revalidatePath('/tasks')
  redirect(`/cases/${id}`)
}
