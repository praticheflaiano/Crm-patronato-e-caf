/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getOrCreateUserProfile } from '@/lib/user-profile'
import { getSafeErrorMessage } from '@/lib/supabase-errors'

// DB-backed chat memory: load the current conversation's messages, or start a
// fresh conversation. All rows are RLS-scoped to the calling user.

const MAX_MESSAGES = 200

// GET: return the user's most recent conversation (creating one if none exists)
// together with its messages, so the chat UI can restore history on any device.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { data: conv, error: convErr } = await supabase
    .from('chat_conversations')
    .select('id')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (convErr) return NextResponse.json({ error: getSafeErrorMessage(convErr) }, { status: 500 })

  if (!conv) {
    return NextResponse.json({ conversationId: null, messages: [] })
  }

  const conversationId = (conv as any).id as string
  const { data: msgs, error: msgErr } = await supabase
    .from('chat_messages')
    .select('id, role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(MAX_MESSAGES)

  if (msgErr) return NextResponse.json({ error: getSafeErrorMessage(msgErr) }, { status: 500 })

  return NextResponse.json({ conversationId, messages: Array.isArray(msgs) ? msgs : [] })
}

// POST { action: 'new' }: create a fresh conversation and return its id.
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (body?.action !== 'new') {
    return NextResponse.json({ error: 'Azione non valida.' }, { status: 400 })
  }

  const profile = await getOrCreateUserProfile(user)
  const { data, error } = await supabase
    .from('chat_conversations')
    .insert({ user_id: user.id, organization_id: profile?.organization_id ?? null } as never)
    .select('id')
    .single()

  if (error || !data) return NextResponse.json({ error: getSafeErrorMessage(error) }, { status: 500 })
  return NextResponse.json({ conversationId: (data as any).id })
}

// DELETE: clear the user's chat history (all conversations).
export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { error } = await supabase.from('chat_conversations').delete().eq('user_id', user.id)
  if (error) return NextResponse.json({ error: getSafeErrorMessage(error) }, { status: 500 })
  return NextResponse.json({ ok: true })
}
