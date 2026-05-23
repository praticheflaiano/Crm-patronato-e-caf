import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { getOrCreateUserProfile } from '@/lib/user-profile'
import { getSafeErrorMessage, isMissingSchemaResourceError } from '@/lib/supabase-errors'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  const url = new URL(request.url)
  const caseId = url.searchParams.get('case_id')
  const completed = url.searchParams.get('completed')

  let query = supabase
    .from('tasks')
    .select('*, cases(id, title, status, type, contacts(id, first_name, last_name, fiscal_code))')
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (caseId) query = query.eq('case_id', caseId)
  if (completed === 'true') query = query.eq('is_completed', true)
  if (completed === 'false') query = query.eq('is_completed', false)

  const { data, error } = await query
  if (error) {
    if (isMissingSchemaResourceError(error)) return NextResponse.json([])
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

  const profile = await getOrCreateUserProfile(user)
  const taskData = await request.json().catch(() => null)

  if (!taskData?.title) {
    return NextResponse.json({ error: 'Il titolo della scadenza è richiesto' }, { status: 400 })
  }

  const payload = {
    title: String(taskData.title).trim(),
    description: taskData.description ? String(taskData.description).trim() : null,
    due_date: taskData.due_date || null,
    case_id: taskData.case_id || null,
    assigned_to: taskData.assigned_to || user.id,
    organization_id: taskData.organization_id || profile?.organization_id,
    is_completed: Boolean(taskData.is_completed),
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert(payload as never)
    .select('*, cases(id, title, status, type, contacts(id, first_name, last_name, fiscal_code))')

  if (error) {
    if (isMissingSchemaResourceError(error)) {
      return NextResponse.json({ error: 'Modulo scadenze non disponibile' }, { status: 503 })
    }
    return NextResponse.json({ error: getSafeErrorMessage(error) }, { status: 500 })
  }

  return NextResponse.json(Array.isArray(data) ? data[0] ?? null : data)
}
