import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseUrl } from './config'

const PUBLIC_ROUTES = ['/login', '/auth', '/access']

function getSupabaseAuthCookiePrefix() {
  const supabaseUrl = getSupabaseUrl()

  try {
    const hostname = new URL(supabaseUrl).hostname
    const projectRef = hostname.split('.')[0]
    return `sb-${projectRef}-auth-token`
  } catch {
    return 'sb-'
  }
}

function hasSupabaseSessionCookie(request: NextRequest) {
  const authCookiePrefix = getSupabaseAuthCookiePrefix()

  return request.cookies.getAll().some((cookie) => {
    // Default @supabase/ssr cookie:
    // sb-<project-ref>-auth-token
    // It may also be chunked as sb-<project-ref>-auth-token.0, .1, ...
    return (
      cookie.name === authCookiePrefix ||
      cookie.name.startsWith(`${authCookiePrefix}.`) ||
      // Legacy temporary cookie used during early deploy tests.
      cookie.name === 'sb-access-token'
    )
  })
}

export async function updateSession(request: NextRequest) {
  const isAuthenticated = hasSupabaseSessionCookie(request)
  const isPublicRoute = PUBLIC_ROUTES.some(route => request.nextUrl.pathname.startsWith(route))

  if (!isAuthenticated && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (isAuthenticated && (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/access'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return NextResponse.next({ request })
}