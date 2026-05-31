import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { getSafeErrorMessage, isMissingSchemaResourceError } from '@/lib/supabase-errors'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorizzato', count: 0 }, { status: 401 })
  }

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) {
    if (isMissingSchemaResourceError(error)) {
      return NextResponse.json({ count: 0 })
    }
    return NextResponse.json({ error: getSafeErrorMessage(error), count: 0 }, { status: 500 })
  }

  return NextResponse.json({ count: count ?? 0 })
}
