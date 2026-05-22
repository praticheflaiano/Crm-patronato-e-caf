import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
  
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const notificationData = await request.json()
  const { data, error } = await supabase
    .from('notifications')
    .insert(notificationData)
    .select()
  
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}