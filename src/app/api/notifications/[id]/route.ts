import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { getSafeErrorMessage, isMissingSchemaResourceError } from '@/lib/supabase-errors'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) {
    if (isMissingSchemaResourceError(error)) {
      return NextResponse.json({ ok: false, error: 'Modulo notifiche non ancora migrato' }, { status: 404 })
    }
    return NextResponse.json({ ok: false, error: getSafeErrorMessage(error) }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  // Only the is_read flag may be updated by the client.
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true } as never)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()

  if (error) {
    if (isMissingSchemaResourceError(error)) {
      return NextResponse.json({ ok: false, skipped: true, error: 'Modulo notifiche non ancora migrato' })
    }
    return NextResponse.json({ ok: false, error: getSafeErrorMessage(error) }, { status: 500 })
  }

  return NextResponse.json(Array.isArray(data) ? data : [])
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    if (isMissingSchemaResourceError(error)) {
      return NextResponse.json({ ok: false, skipped: true, error: 'Modulo notifiche non ancora migrato' })
    }
    return NextResponse.json({ ok: false, error: getSafeErrorMessage(error) }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
