import { createClient } from '@/utils/supabase/server'

export async function GET(req: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ contacts: [], cases: [] }, { status: 401 })
  }

  const q = new URL(req.url).searchParams.get('q') ?? ''

  if (q.length < 2) {
    return Response.json({ contacts: [], cases: [] })
  }

  // Sanitise: remove characters that would break PostgREST .or() syntax
  const safe = q.replace(/[%(),]/g, '')

  const [{ data: data1 }, { data: data2 }] = await Promise.all([
    supabase
      .from('contacts')
      .select('id, first_name, last_name, fiscal_code')
      .or(
        `first_name.ilike.%${safe}%,last_name.ilike.%${safe}%,fiscal_code.ilike.%${safe}%,email.ilike.%${safe}%,phone.ilike.%${safe}%`
      )
      .limit(8),
    supabase
      .from('cases')
      .select('id, title, type, status')
      .ilike('title', `%${safe}%`)
      .limit(8),
  ])

  return Response.json({ contacts: data1 ?? [], cases: data2 ?? [] })
}
