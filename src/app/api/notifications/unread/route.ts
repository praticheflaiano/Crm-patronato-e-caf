import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false)
  
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ count: count ?? 0 })
}