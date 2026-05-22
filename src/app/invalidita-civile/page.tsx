import Link from 'next/link'
import { Plus, FileText } from 'lucide-react'
import { SetupNotice } from '@/components/setup-notice'
import { InvaliditaList } from '@/components/invalidita/InvaliditaList'
import { hasSupabaseConfig } from '@/utils/supabase/config'
import { createClient } from '@/utils/supabase/server'

export default async function InvaliditaCivilePage() {
  if (!hasSupabaseConfig()) {
    return <SetupNotice />
  }

  const supabase = await createClient()

  const { data: cases, error } = await supabase
    .from('cases')
    .select(`
      id,
      title,
      status,
      created_at,
      contacts (
        first_name,
        last_name
      ),
      invalidity_details (
        disability_type,
        disability_percentage,
        assessment_status,
        certification_expiry_date
      )
    `)
    .eq('type', 'invalidita_civile')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Invalidità Civile</h1>
          <p className="mt-1 text-sm text-slate-500">Gestisci pratiche di invalidità civile, certificati medici e iter INPS.</p>
        </div>
        <Link 
          href="/invalidita-civile/new" 
          className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          <Plus size={16} aria-hidden="true" />
          Nuova Pratica Invalidità
        </Link>
      </div>

      {/* Info Banner */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold">Modulo Invalidità Civile</p>
            <p className="mt-1">
              Le pratiche di invalidità civile includono la gestione dei certificati medici, 
              l&apos;iter di visita INPS e il riconoscimento delle prestazioni.
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-700">Errore nel caricamento delle pratiche: {error.message}</p>
        </div>
      ) : (
        <InvaliditaList cases={cases || []} />
      )}
    </div>
  )
}