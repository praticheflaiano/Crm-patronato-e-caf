import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { getOrCreateUserProfile } from '@/lib/user-profile'
import { getSafeErrorMessage, isMissingSchemaResourceError } from '@/lib/supabase-errors'

type TaskNotesRouteContext = { params: Promise<{ taskId: string }> }

export async function GET(request: Request, { params }: TaskNotesRouteContext) {
  const { taskId } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('task_notes')
    .select('*, profiles(id, first_name, last_name)')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })

  if (error) {
    if (isMissingSchemaResourceError(error)) return NextResponse.json([])
    return NextResponse.json({ error: getSafeErrorMessage(error) }, { status: 500 })
  }

  return NextResponse.json(Array.isArray(data) ? data : [])
}

export async function POST(request: Request, { params }: TaskNotesRouteContext) {
  const { taskId } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  const profile = await getOrCreateUserProfile(user)
  const payload = await request.json().catch(() => null)

  if (!payload?.content) {
    return NextResponse.json({ error: 'Contenuto richiesto' }, { status: 400 })
  }

  const note = {
    task_id: taskId,
    author_id: profile?.id,
    content: String(payload.content).trim(),
  }

  const { data, error } = await supabase
    .from('task_notes')
    .insert(note as never)
    .select('*, profiles(id, first_name, last_name)')

  if (error) {
    return NextResponse.json({ error: getSafeErrorMessage(error) }, { status: 500 })
  }

  return NextResponse.json(Array.isArray(data) ? data[0] ?? null : data)
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  const payload = await request.json().catch(() => null)
  if (!payload?.id || !payload?.content) {
    return NextResponse.json({ error: 'ID e contenuto richiesti' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('task_notes')
    .update({ content: String(payload.content).trim(), updated_at: new Date().toISOString() } as never)
    .eq('id', payload.id)
    .eq('author_id', user.id)
    .select('*, profiles(id, first_name, last_name)')

  if (error) {
    return NextResponse.json({ error: getSafeErrorMessage(error) }, { status: 500 })
  }

  return NextResponse.json(Array.isArray(data) ? data[0] ?? null : data)
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  const payload = await request.json().catch(() => null)
  if (!payload?.id) {
    return NextResponse.json({ error: 'ID richiesto' }, { status: 400 })
  }

  const { error } = await supabase
    .from('task_notes')
    .delete()
    .eq('id', payload.id)
    .eq('author_id', user.id)

  if (error) {
    return NextResponse.json({ error: getSafeErrorMessage(error) }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
