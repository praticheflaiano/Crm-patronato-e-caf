import { createClient } from '@/utils/supabase/server'
import { toCsv } from '@/lib/csv'

const COLUMNS = [
  { key: 'title',        label: 'Titolo' },
  { key: 'type',         label: 'Tipo' },
  { key: 'status',       label: 'Stato' },
  { key: 'created_at',   label: 'Creata il' },
  { key: 'cliente',      label: 'Cliente' },
  { key: 'fiscal_code',  label: 'Codice Fiscale' },
]

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { data, error } = await supabase
    .from('cases')
    .select('title, type, status, created_at, contacts(first_name, last_name, fiscal_code)')
    .order('created_at', { ascending: false })

  if (error) {
    return new Response(`Export error: ${error.message}`, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = ((data ?? []) as any[]).map((item: any) => ({
    title:       item.title,
    type:        item.type,
    status:      item.status,
    created_at:  item.created_at,
    cliente:     `${item.contacts?.last_name ?? ''} ${item.contacts?.first_name ?? ''}`.trim(),
    fiscal_code: item.contacts?.fiscal_code ?? '',
  }))

  const csv = toCsv(rows, COLUMNS)

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="pratiche.csv"',
    },
  })
}
