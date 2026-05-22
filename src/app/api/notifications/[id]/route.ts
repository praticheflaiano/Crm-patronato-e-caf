import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const updateData = await request.json()
  const { data, error } = await supabase
    .from('notifications')
    .update({ ...updateData, is_read: true } as never)
    .eq('id', id)
    .select()
  
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id)
  
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ status: 'success' })
}