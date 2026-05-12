'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function createCase(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const rawData = {
    title: formData.get('title') as string,
    description: formData.get('description') as string || null,
    contact_id: formData.get('contact_id') as string,
    type: formData.get('type') as 'caf' | 'patronato' | 'invalidita_civile',
    status: 'open',
    assigned_to: user.id
  }

  const { error } = await supabase
    .from('cases')
    .insert([rawData] as any /* eslint-disable-line @typescript-eslint/no-explicit-any */)

  if (error) {
    console.error("Error inserting case:", error)
    redirect('/error')
  }

  revalidatePath('/cases')
  redirect('/cases')
}
