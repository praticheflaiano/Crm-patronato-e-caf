/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getSafeErrorMessage } from '@/lib/supabase-errors'

// Shared message board between operators and the invited certifying doctor.
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const caseId = new URL(request.url).searchParams.get('caseId')
  if (!caseId) return NextResponse.json({ error: 'caseId mancante' }, { status: 400 })

  // RLS restricts rows to org members and invited collaborators of this case.
  const { data, error } = await (supabase as any)
    .from('case_messages')
    .select('id, body, author_id, created_at')
    .eq('case_id', caseId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: getSafeErrorMessage(error) }, { status: 500 })

  const messages = Array.isArray(data) ? data : []
  const authorIds = [...new Set(messages.map((m: any) => m.author_id).filter(Boolean))]
  let names: Record<string, string> = {}
  if (authorIds.length) {
    const { data: profiles } = await (supabase as any)
      .from('profiles')
      .select('id, full_name')
      .in('id', authorIds)
    names = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p.full_name || 'Utente']))
  }

  return NextResponse.json(
    messages.map((m: any) => ({
      ...m,
      author_name: m.author_id ? names[m.author_id] || 'Utente' : 'Sistema',
      is_me: m.author_id === user.id,
    }))
  )
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const caseId = body?.caseId
  const text = String(body?.body || '').trim()
  if (!caseId || !text) return NextResponse.json({ error: 'Messaggio non valido' }, { status: 400 })

  // RLS enforces that the author belongs to the case (org member or collaborator).
  const { data, error } = await (supabase as any)
    .from('case_messages')
    .insert({ case_id: caseId, author_id: user.id, body: text })
    .select('id, body, author_id, created_at')
    .single()

  if (error) return NextResponse.json({ error: getSafeErrorMessage(error) }, { status: 500 })
  return NextResponse.json({ ...data, is_me: true })
}
