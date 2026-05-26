'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function updateCase(formData: FormData) {
  const id = formData.get('id') as string
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const payload = {
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || null,
    contact_id: formData.get('contact_id') as string,
    type: formData.get('type') as 'caf' | 'patronato' | 'invalidita_civile' | 'tari',
    status: formData.get('status') as 'open' | 'in_progress' | 'pending_documents' | 'completed' | 'rejected',
  }

  const casesTable = supabase.from('cases') as any /* eslint-disable-line @typescript-eslint/no-explicit-any */
  const { error } = await casesTable
    .update(payload)
    .eq('id', id)

  if (error) {
    redirect('/error')
  }

  revalidatePath('/cases')
  revalidatePath(`/cases/${id}`)
  redirect(`/cases/${id}`)
}
