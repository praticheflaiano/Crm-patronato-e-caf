import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { getSafeErrorMessage, isMissingSchemaResourceError } from '@/lib/supabase-errors'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('id', id)
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
  const updateData = await request.json().catch(() => ({}))
  const { data, error } = await supabase
    .from('notifications')
    .update({ ...updateData, is_read: true } as never)
    .eq('id', id)
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
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id)
  
  if (error) {
    if (isMissingSchemaResourceError(error)) {
      return NextResponse.json({ ok: false, skipped: true, error: 'Modulo notifiche non ancora migrato' })
    }
    return NextResponse.json({ ok: false, error: getSafeErrorMessage(error) }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
