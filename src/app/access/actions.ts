'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

type ActionState = { error?: string; success?: string } | null

export async function adminLogin(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email e password sono obbligatorie' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !data.user) {
    return { error: error?.message ?? 'Login fallito' }
  }

  // Force cookie commit BEFORE redirect — critical for middleware to see the session
  const cookieStore = await cookies()
  const session = data.session
  if (session) {
    cookieStore.set('sb-access-token', session.access_token, {
      httpOnly: false, // Must be readable by JS for middleware
      secure: true,
      sameSite: 'lax',
      path: '/',
    })
    if (session.refresh_token) {
      cookieStore.set('sb-refresh-token', session.refresh_token, {
        httpOnly: false,
        secure: true,
        sameSite: 'lax',
        path: '/',
      })
    }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}