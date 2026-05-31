import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { getOrCreateUserProfile } from '@/lib/user-profile'
import { getSafeErrorMessage, isMissingSchemaResourceError } from '@/lib/supabase-errors'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    if (isMissingSchemaResourceError(error)) {
      return NextResponse.json([])
    }
    return NextResponse.json({ error: getSafeErrorMessage(error) }, { status: 500 })
  }

  return NextResponse.json(Array.isArray(data) ? data : [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  const notificationData = await request.json().catch(() => null)

  if (!notificationData) {
    return NextResponse.json({ ok: false, error: 'Payload non valido' }, { status: 400 })
  }

  const profile = await getOrCreateUserProfile(user)

  // Explicitly whitelist allowed columns; never spread the raw client body.
  // user_id / organization_id are always derived server-side.
  const payload = {
    title: notificationData.title ? String(notificationData.title) : null,
    message: notificationData.message ? String(notificationData.message) : null,
    type: notificationData.type ? String(notificationData.type) : null,
    related_id: notificationData.related_id ? String(notificationData.related_id) : null,
    user_id: user.id,
    organization_id: profile?.organization_id ?? null,
  }

  const { data, error } = await supabase
    .from('notifications')
    .insert(payload as never)
    .select()

  if (error) {
    if (isMissingSchemaResourceError(error)) {
      return NextResponse.json({ ok: false, skipped: true, error: 'Modulo notifiche non ancora migrato' })
    }
    return NextResponse.json({ ok: false, error: getSafeErrorMessage(error) }, { status: 500 })
  }

  return NextResponse.json(Array.isArray(data) ? data : [])
}
