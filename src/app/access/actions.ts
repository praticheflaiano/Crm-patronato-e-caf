'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase/server'

const ADMIN_EMAIL = 'praticheflaiano@gmail.com'

export async function sendAdminMagicLink(_formData: FormData): Promise<void> {
  const supabaseAdmin = createAdminClient()

  const { error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: ADMIN_EMAIL,
  })

  if (error) {
    // In production, log error and show user-friendly message
    console.error('Magic link error:', error.message)
  }

  // Always redirect to login — Supabase sends email if user exists
  redirect('/login?magic_sent=1')
}