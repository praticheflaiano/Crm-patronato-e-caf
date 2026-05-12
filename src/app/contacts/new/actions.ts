'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function createContact(formData: FormData) {
  const supabase = await createClient()

  // Get currently authenticated user to link them
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const rawData = {
    first_name: formData.get('first_name') as string,
    last_name: formData.get('last_name') as string,
    fiscal_code: formData.get('fiscal_code') as string,
    email: formData.get('email') as string || null,
    phone: formData.get('phone') as string || null,
    date_of_birth: formData.get('date_of_birth') as string || null,
    address: formData.get('address') as string || null,
    user_id: user.id
  }

  const { error } = await supabase
    .from('contacts')
    .insert([rawData] as any /* eslint-disable-line @typescript-eslint/no-explicit-any */)

  if (error) {
    // Ideally we return an error state to the form here
    console.error("Error inserting contact:", error)
    redirect('/error')
  }

  revalidatePath('/contacts')
  redirect('/contacts')
}
