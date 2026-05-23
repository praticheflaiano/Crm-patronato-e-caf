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
    .from('tasks')
    .select('*, cases(id, title, status, type, contacts(id, first_name, last_name, fiscal_code))')
    .eq('id', id)
    .single()

  if (error) {
    if (isMissingSchemaResourceError(error)) return NextResponse.json({ error: 'Modulo scadenze non disponibile' }, { status: 404 })
    return NextResponse.json({ error: 'Task non trovato' }, { status: 404 })
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

  const body = await request.json().catch(() => ({}))
  const updateData = {
    title: body.title,
    description: body.description,
    due_date: body.due_date,
    is_completed: typeof body.is_completed === 'boolean' ? body.is_completed : undefined,
    updated_at: new Date().toISOString(),
  }

  Object.keys(updateData).forEach((key) => {
    if ((updateData as Record<string, unknown>)[key] === undefined) {
      delete (updateData as Record<string, unknown>)[key]
    }
  })

  const { data, error } = await supabase
    .from('tasks')
    .update(updateData as never)
    .eq('id', id)
    .select('*, cases(id, title, status, type, contacts(id, first_name, last_name, fiscal_code))')

  if (error) {
    if (isMissingSchemaResourceError(error)) return NextResponse.json({ error: 'Modulo scadenze non disponibile' }, { status: 503 })
    return NextResponse.json({ error: getSafeErrorMessage(error) }, { status: 500 })
  }
  return NextResponse.json(Array.isArray(data) ? data[0] ?? null : data)
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

  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) {
    if (isMissingSchemaResourceError(error)) return NextResponse.json({ ok: false, error: 'Modulo scadenze non disponibile' }, { status: 503 })
    return NextResponse.json({ ok: false, error: getSafeErrorMessage(error) }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
