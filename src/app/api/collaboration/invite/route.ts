/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/utils/supabase/server'
import { getOrCreateUserProfile } from '@/lib/user-profile'

// Operators link an external certifying doctor's account to a specific case.
// The doctor must already have an account; they then get per-case access via RLS.
async function assertOperatorOfCase(supabase: any, userId: string, caseId: string) {
  const profile = await getOrCreateUserProfile({ id: userId })
  if (!profile || !['admin', 'operator'].includes(profile.role)) return null
  const { data: caseRow } = await supabase
    .from('cases').select('id, organization_id').eq('id', caseId).single()
  if (!caseRow || caseRow.organization_id !== profile.organization_id) return null
  return profile
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const caseId = body?.caseId
  const email = String(body?.email || '').trim().toLowerCase()
  if (!caseId || !email) return NextResponse.json({ error: 'Email e pratica richieste' }, { status: 400 })

  const profile = await assertOperatorOfCase(supabase as any, user.id, caseId)
  if (!profile) return NextResponse.json({ error: 'Permesso negato' }, { status: 403 })

  // Look up the doctor's auth account by email (admin privileges, server-side only).
  let admin
  try {
    admin = createAdminClient()
  } catch {
    return NextResponse.json({ error: 'Inviti non configurati: manca SUPABASE_SERVICE_ROLE_KEY.' }, { status: 503 })
  }

  const { data: list, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (listError) return NextResponse.json({ error: 'Errore nella ricerca utente' }, { status: 500 })

  const target = list.users.find((u: any) => (u.email || '').toLowerCase() === email)
  if (!target) {
    return NextResponse.json(
      { error: "Nessun account trovato con questa email. Chiedi al medico di registrarsi, poi riprova." },
      { status: 404 }
    )
  }

  const { error: insErr } = await (supabase as any)
    .from('case_collaborators')
    .upsert({ case_id: caseId, user_id: target.id, role: 'doctor', invited_by: user.id }, { onConflict: 'case_id,user_id' })
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })

  // Keep the existing doctor_id-based features (dashboard, certificate flow) working.
  await (supabase as any).from('cases').update({ doctor_id: target.id }).eq('id', caseId)

  return NextResponse.json({ ok: true, doctor: { id: target.id, email: target.email } })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const caseId = body?.caseId
  const userId = body?.userId
  if (!caseId || !userId) return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 })

  const profile = await assertOperatorOfCase(supabase as any, user.id, caseId)
  if (!profile) return NextResponse.json({ error: 'Permesso negato' }, { status: 403 })

  await (supabase as any).from('case_collaborators').delete().eq('case_id', caseId).eq('user_id', userId)
  // Clear the linked doctor if it was this user.
  const { data: caseRow } = await (supabase as any).from('cases').select('doctor_id').eq('id', caseId).single()
  if (caseRow?.doctor_id === userId) {
    await (supabase as any).from('cases').update({ doctor_id: null }).eq('id', caseId)
  }
  return NextResponse.json({ ok: true })
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const caseId = new URL(request.url).searchParams.get('caseId')
  if (!caseId) return NextResponse.json({ error: 'caseId mancante' }, { status: 400 })

  const { data, error } = await (supabase as any)
    .from('case_collaborators')
    .select('id, user_id, role, created_at')
    .eq('case_id', caseId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const ids = (data ?? []).map((c: any) => c.user_id)
  let names: Record<string, string> = {}
  if (ids.length) {
    const { data: profiles } = await (supabase as any).from('profiles').select('id, full_name').in('id', ids)
    names = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p.full_name || 'Medico']))
  }
  return NextResponse.json((data ?? []).map((c: any) => ({ ...c, name: names[c.user_id] || 'Medico' })))
}
