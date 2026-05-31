/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getSafeErrorMessage } from '@/lib/supabase-errors'
import { notifyUser } from '@/lib/notifications'

// Structured requests between operator and doctor (e.g. "serve certificato aggiornato").
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const caseId = new URL(request.url).searchParams.get('caseId')
  if (!caseId) return NextResponse.json({ error: 'caseId mancante' }, { status: 400 })

  const { data, error } = await (supabase as any)
    .from('case_requests')
    .select('id, title, details, status, requested_by, assigned_to, created_at, resolved_at')
    .eq('case_id', caseId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: getSafeErrorMessage(error) }, { status: 500 })
  return NextResponse.json(Array.isArray(data) ? data : [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const caseId = body?.caseId
  const title = String(body?.title || '').trim()
  const details = body?.details ? String(body.details).trim() : null
  if (!caseId || !title) return NextResponse.json({ error: 'Titolo richiesta mancante' }, { status: 400 })

  // Route the request to the doctor linked to the case, when present.
  const { data: caseRow } = await (supabase as any)
    .from('cases').select('doctor_id').eq('id', caseId).single()

  const { data, error } = await (supabase as any)
    .from('case_requests')
    .insert({
      case_id: caseId,
      requested_by: user.id,
      assigned_to: caseRow?.doctor_id ?? null,
      title,
      details,
      status: 'open',
    })
    .select('id, title, details, status, requested_by, assigned_to, created_at, resolved_at')
    .single()

  if (error) return NextResponse.json({ error: getSafeErrorMessage(error) }, { status: 500 })

  // Notify the assigned doctor of the new request (skip self-assignment).
  if (data?.assigned_to && data.assigned_to !== user.id) {
    await notifyUser(supabase as any, {
      userId: data.assigned_to,
      title: 'Nuova richiesta su una pratica',
      message: title,
      type: 'case',
      relatedId: caseId,
    })
  }

  return NextResponse.json(data)
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const id = body?.id
  const status = String(body?.status || '')
  const allowed = ['open', 'in_progress', 'resolved', 'cancelled']
  if (!id || !allowed.includes(status)) return NextResponse.json({ error: 'Aggiornamento non valido' }, { status: 400 })

  const { data, error } = await (supabase as any)
    .from('case_requests')
    .update({ status, resolved_at: status === 'resolved' ? new Date().toISOString() : null })
    .eq('id', id)
    .select('id, title, details, status, requested_by, assigned_to, created_at, resolved_at')
    .single()

  if (error) return NextResponse.json({ error: getSafeErrorMessage(error) }, { status: 500 })
  return NextResponse.json(data)
}
