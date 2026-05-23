import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

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
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching task:', error)
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
  
  const updateData = await request.json()
  const { data, error } = await supabase
    .from('tasks')
    .update(updateData as never)
    .eq('id', id)
    .select()
  
  if (error) {
    console.error('Error updating task:', error)
    return NextResponse.json({ error: 'Errore aggiornamento task' }, { status: 500 })
  }
  return NextResponse.json(data)
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
    console.error('Error deleting task:', error)
    return NextResponse.json({ error: 'Errore eliminazione task' }, { status: 500 })
  }
  return NextResponse.json({ status: 'success' })
}