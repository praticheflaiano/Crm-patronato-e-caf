import { createClient } from '@/utils/supabase/server'
import { toCsv } from '@/lib/csv'

const COLUMNS = [
  { key: 'last_name',     label: 'Cognome' },
  { key: 'first_name',    label: 'Nome' },
  { key: 'fiscal_code',   label: 'Codice Fiscale' },
  { key: 'email',         label: 'Email' },
  { key: 'phone',         label: 'Telefono' },
  { key: 'date_of_birth', label: 'Data di nascita' },
  { key: 'address',       label: 'Indirizzo' },
]

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { data, error } = await supabase
    .from('contacts')
    .select('last_name, first_name, fiscal_code, email, phone, date_of_birth, address')
    .order('last_name')

  if (error) {
    return new Response(`Export error: ${error.message}`, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []) as Record<string, any>[]
  const csv = toCsv(rows, COLUMNS)

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="contatti.csv"',
    },
  })
}
