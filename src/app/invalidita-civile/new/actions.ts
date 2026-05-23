/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function createInvaliditaCase(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  const profileTyped = profile as any
  if (!profileTyped || !['admin', 'operator'].includes(profileTyped.role)) {
    throw new Error('Non autorizzato a creare pratiche di invalidità civile')
  }

  const title = formData.get('title') as string
  const contact_id = formData.get('contact_id') as string
  const description = formData.get('description') as string

  if (!title || !contact_id) {
    throw new Error('Titolo e contatto sono obbligatori')
  }

  // Create the case
  const { data: caseData, error: caseError } = await supabase
    .from('cases')
    .insert({
      title,
      contact_id,
      description: description || null,
      type: 'invalidita_civile',
      status: 'open',
      organization_id: profileTyped.organization_id,
      assigned_to: user.id,
    } as any)
    .select()
    .single()

  if (caseError) {
    console.error('Error creating invalidità case:', caseError)
    throw new Error('Errore nella creazione della pratica')
  }

  revalidatePath('/invalidita-civile')
  const caseDataTyped = caseData as any
  redirect(`/invalidita-civile/${caseDataTyped.id}`)
}