import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const token = requestUrl.searchParams.get('token')
  const type = requestUrl.searchParams.get('type') ?? 'magiclink'
  const redirectTo = requestUrl.searchParams.get('redirect_to') ?? '/'

  if (!token) {
    return NextResponse.redirect(new URL('/access?error=no_token', requestUrl.origin))
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://xjchklrrmyavizozhtpb.supabase.co'
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqY2hrbHJteW12aW96aHRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NzYzMDcsImV4cCI6MjA5NDE1MjMwN30.-jwzje0VXfmysMIff5yV_iYbpd7ndw1YEtM4Les30ok'

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
  await supabase.auth.verifyOtp({
    email: 'praticheflaiano@gmail.com',
    token,
    type: type as 'magiclink' | 'recovery' | 'signup' | 'invite',
  })

  return response
}