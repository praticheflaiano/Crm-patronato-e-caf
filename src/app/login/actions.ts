'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { hasSupabaseConfig } from '@/utils/supabase/config'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  if (!hasSupabaseConfig()) {
    redirect('/error')
  }

  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/error?reason=login_failed')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  if (!hasSupabaseConfig()) {
    redirect('/error')
  }

  const supabase = await createClient()

  const fullName = formData.get('full_name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('/rest/v1', '')}/login`,
    },
  })

  if (error) {
    redirect('/error?reason=signup_failed')
  }

  revalidatePath('/', 'layout')
  redirect('/login?registered=1')
}

export async function logout() {
  if (!hasSupabaseConfig()) {
    redirect('/login')
  }

  const supabase = await createClient()
  await supabase.auth.signOut()

  revalidatePath('/', 'layout')
  redirect('/login')
}