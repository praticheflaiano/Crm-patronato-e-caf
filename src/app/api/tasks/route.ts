
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('tasks').select('*')
  
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const taskData = await request.json()
  const { data, error } = await supabase.from('tasks').insert(taskData).select()
  
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}
