import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getSupabasePublishableKey, getSupabaseUrl } from '@/utils/supabase/config'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const token = requestUrl.searchParams.get('token')
  const type = requestUrl.searchParams.get('type') ?? 'magiclink'
  const redirectTo = requestUrl.searchParams.get('redirect_to') ?? '/'

  if (!token) {
    return NextResponse.redirect(new URL('/access?error=no_token', requestUrl.origin))
  }

  const supabaseUrl = getSupabaseUrl()
  const supabaseKey = getSupabasePublishableKey()

  if (!supabaseUrl || !supabaseKey) {
    console.error('Auth callback: Supabase environment variables are not configured')
    return NextResponse.redirect(new URL('/error', requestUrl.origin))
  }

  // verifyOtp requires the same email that was used to request the token.
  // Require it explicitly from the request — never default to a hardcoded address.
  const email = requestUrl.searchParams.get('email')
  if (!email) {
    return NextResponse.redirect(new URL('/access?error=no_email', requestUrl.origin))
  }

  // Create a response that redirects to home
  const response = NextResponse.redirect(new URL(redirectTo, requestUrl.origin))

  // Exchange the magic link token for a session using the SSR client
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value)
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  // Verify the OTP token to establish the session
  const { data: authData, error: verifyError } = await supabase.auth.verifyOtp({
    email: email,
    token,
    type: type as 'magiclink' | 'recovery' | 'signup' | 'invite',
  })

  // If verification failed, check if there's a session already (edge case)
  if (verifyError && !authData?.user) {
    // The token might be a session token from email confirmation
    console.error('OTP verification error:', verifyError.message)
    return NextResponse.redirect(new URL('/login?error=auth_failed', requestUrl.origin))
  }

  return response
}