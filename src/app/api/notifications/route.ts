import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { getSafeErrorMessage, isMissingSchemaResourceError } from '@/lib/supabase-errors'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
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
  const notificationData = await request.json().catch(() => null)

  if (!notificationData) {
    return NextResponse.json({ ok: false, error: 'Payload non valido' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('notifications')
    .insert(notificationData)
    .select()
  
  if (error) {
    if (isMissingSchemaResourceError(error)) {
      return NextResponse.json({ ok: false, skipped: true, error: 'Modulo notifiche non ancora migrato' })
    }
    return NextResponse.json({ ok: false, error: getSafeErrorMessage(error) }, { status: 500 })
  }

  return NextResponse.json(Array.isArray(data) ? data : [])
}
