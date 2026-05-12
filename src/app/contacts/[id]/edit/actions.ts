'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function updateContact(formData: FormData) {
  const id = formData.get('id') as string
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const payload = {
    first_name: formData.get('first_name') as string,
    last_name: formData.get('last_name') as string,
    fiscal_code: formData.get('fiscal_code') as string,
    email: (formData.get('email') as string) || null,
    phone: (formData.get('phone') as string) || null,
    date_of_birth: (formData.get('date_of_birth') as string) || null,
    address: (formData.get('address') as string) || null,
  }

  const contactsTable = supabase.from('contacts') as any /* eslint-disable-line @typescript-eslint/no-explicit-any */
  const { error } = await contactsTable
    .update(payload)
    .eq('id', id)

  if (error) {
    redirect('/error')
  }

  revalidatePath('/contacts')
  revalidatePath(`/contacts/${id}`)
  redirect(`/contacts/${id}`)
}
