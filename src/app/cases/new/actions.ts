'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { hasSupabaseConfig } from '@/utils/supabase/config'
import { createClient } from '@/utils/supabase/server'
import { getOrCreateUserProfile } from '@/lib/user-profile'

export async function createCase(formData: FormData) {
  if (!hasSupabaseConfig()) {
    redirect('/error')
  }

  const title = String(formData.get('title') || '').trim()
  const type = String(formData.get('type') || '').trim()
  const description = String(formData.get('description') || '').trim()
  const contactMode = String(formData.get('contact_mode') || 'existing').trim()

  if (!title || !type) {
    redirect('/cases/new?error=missing')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const profile = await getOrCreateUserProfile(user)
  if (!profile?.organization_id) {
    redirect('/cases/new?error=profile')
  }

  let contactId = String(formData.get('contact_id') || '').trim()

  // Create the contact inline when the operator chose "Nuovo contatto".
  if (contactMode === 'new') {
    const firstName = String(formData.get('new_first_name') || '').trim()
    const lastName = String(formData.get('new_last_name') || '').trim()
    const fiscalCode = String(formData.get('new_fiscal_code') || '').trim().toUpperCase()
    const phone = String(formData.get('new_phone') || '').trim()
    const email = String(formData.get('new_email') || '').trim()

    if (!firstName || !lastName || !fiscalCode) {
      redirect('/cases/new?error=contact')
    }

    const { data: newContact, error: contactError } = await supabase
      .from('contacts')
      .insert({
        first_name: firstName,
        last_name: lastName,
        fiscal_code: fiscalCode,
        phone: phone || null,
        email: email || null,
        organization_id: profile.organization_id,
        user_id: user.id,
      } as never)
      .select('id')
      .single()

    if (contactError || !newContact) {
      // Most common cause: duplicate fiscal code (unique constraint).
      redirect('/cases/new?error=contact_duplicate')
    }

    contactId = (newContact as { id: string }).id
    revalidatePath('/contacts')
  }

  if (!contactId) {
    redirect('/cases/new?error=missing')
  }

  const { data: inserted, error } = await supabase
    .from('cases')
    .insert({
      title,
      type,
      contact_id: contactId,
      description: description || null,
      status: 'open',
      assigned_to: user.id,
      organization_id: profile.organization_id,
    } as never)
    .select('id')
    .single()

  if (error) {
    console.error('Error inserting case:', error)
    redirect('/cases/new?error=insert')
  }

  const caseId = (inserted as { id: string } | null)?.id
  revalidatePath('/cases')
  redirect(caseId ? `/cases/${caseId}` : '/cases')
}
