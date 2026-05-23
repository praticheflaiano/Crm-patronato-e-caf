import Link from 'next/link'
import { FolderKanban, Plus, Search } from 'lucide-react'
import { SetupNotice } from '@/components/setup-notice'
import { getCaseStatusMeta, getCaseTypeLabel } from '@/lib/case-workflow'
import { hasSupabaseConfig } from '@/utils/supabase/config'
import { createClient } from '@/utils/supabase/server'

export default async function CasesPage() {
  if (!hasSupabaseConfig()) {
    return <SetupNotice />
  }

  const supabase = await createClient()
  const { data: cases, error } = await supabase
    .from('cases')
    .select(`
      *,
      contacts (
        first_name,
        last_name
      )
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Pratiche</h1>
          <p className="mt-1 text-sm text-slate-500">Gestisci workflow CAF, patronato e invalidita civile.</p>
        </div>
        <Link href="/cases/new" className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
          <Plus size={16} aria-hidden="true" />
          Nuova Pratica
        </Link>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-4 text-sm text-slate-500 sm:px-5">
          <Search size={17} aria-hidden="true" className="inline mr-2" />
          <span className="hidden sm:inline">Filtri per stato, tipo e assegnatario saranno disponibili nella prossima fase.</span>
          <span className="sm:hidden">Filtri presto disponibili.</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500 sm:px-5">Titolo</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500 sm:px-5">Contatto</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500 sm:px-5 hidden sm:table-cell">Tipo</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500 sm:px-5">Stato</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500 sm:px-5">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {error ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-red-600">
                    Errore nel caricamento delle pratiche: {error.message}
                  </td>
                </tr>
              ) : !cases || cases.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                      <FolderKanban size={20} aria-hidden="true" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-700">Nessuna pratica trovata</p>
                    <p className="mt-1 text-sm text-slate-500">Crea la prima pratica dopo aver inserito almeno un contatto.</p>
                  </td>
                </tr>
              ) : (
                cases.map((caseItem: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => {
                  const statusMeta = getCaseStatusMeta(caseItem.status)

                  return (
                    <tr key={caseItem.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-slate-950 sm:px-5">{caseItem.title}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600 sm:px-5">
                        {caseItem.contacts ? `${caseItem.contacts.last_name} ${caseItem.contacts.first_name}` : 'N/D'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600 sm:px-5 hidden sm:table-cell">{getCaseTypeLabel(caseItem.type)}</td>
                      <td className="whitespace-nowrap px-4 py-4 sm:px-5">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusMeta.badgeClassName}`}>
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-semibold sm:px-5">
                        <Link href={`/cases/${caseItem.id}`} className="text-blue-700 hover:text-blue-900">Dettagli</Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
