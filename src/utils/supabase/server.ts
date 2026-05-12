import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'
import { getSupabasePublishableKey, getSupabaseUrl } from './config'

export async function createClient() {
  const cookieStore = await cookies()
  const supabaseUrl = getSupabaseUrl()
  const supabaseKey = getSupabasePublishableKey()

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables are not configured')
  }

  return createServerClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error /* eslint-disable-line @typescript-eslint/no-unused-vars */) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Function specifically for admin tasks that require the service role key
// IMPORTANT: Never expose NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY to the browser
export async function createAdminClient() {
    const supabaseUrl = getSupabaseUrl()
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Supabase admin environment variables are not configured')
    }

    return createServerClient<Database>(
        supabaseUrl,
        serviceRoleKey,
        {
          cookies: {
            getAll() {
              return [] // Admin client usually doesn't need user cookies
            },
            setAll() {},
          },
        }
      )
}
