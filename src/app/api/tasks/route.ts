
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  // Verify authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }
  
  const { data, error } = await supabase.from('tasks').select('*')
  
  if (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ error: 'Errore nel recupero dei task' }, { status: 500 })
  }
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  
  // Verify authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }
  
  const taskData = await request.json()
  
  if (!taskData.title || !taskData.case_id) {
    return NextResponse.json({ error: 'Titoli e case_id sono richiesti' }, { status: 400 })
  }
  
  const { data, error } = await supabase.from('tasks').insert(taskData).select()
  
  if (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Errore nella creazione del task' }, { status: 500 })
  }
  return NextResponse.json(data)
}
