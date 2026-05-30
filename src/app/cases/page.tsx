import Link from 'next/link'
import { Download, FolderKanban, Plus, Search } from 'lucide-react'
import { SetupNotice } from '@/components/setup-notice'
import { CASE_STATUSES, CASE_STATUS_META, CASE_TYPES, CASE_TYPE_META, getCaseStatusMeta, getCaseTypeLabel } from '@/lib/case-workflow'
import { formatDateIt } from '@/lib/date-utils'
import { hasSupabaseConfig } from '@/utils/supabase/config'
import { createClient } from '@/utils/supabase/server'

type SearchParams = Record<string, string | string[] | undefined>
type CaseRecord = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

function getCaseDetailHref(caseItem: CaseRecord) {
  return caseItem.type === 'tari' ? `/tari/${caseItem.id}` : `/cases/${caseItem.id}`
}

function getParam(params: SearchParams, key: string) {
  const value = params[key]
  return Array.isArray(value) ? value[0] : value
}

function CaseCard({ caseItem }: { caseItem: CaseRecord }) {
  const statusMeta = getCaseStatusMeta(caseItem.status)
  const nextTask = Array.isArray(caseItem.tasks)
    ? caseItem.tasks.filter((task: CaseRecord) => !task.is_completed && task.due_date).sort((a: CaseRecord, b: CaseRecord) => String(a.due_date).localeCompare(String(b.due_date)))[0]
    : null

  return (
    <Link href={getCaseDetailHref(caseItem)} className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-200 hover:bg-blue-50/30 active:bg-blue-50">
      <div className="flex flex-col gap-3">
        <div>
          <h3 className="break-words text-sm font-semibold text-slate-950">{caseItem.title}</h3>
          <p className="mt-1 text-xs text-slate-500">
            {caseItem.contacts ? `${caseItem.contacts.last_name} ${caseItem.contacts.first_name}` : 'Contatto non associato'} · {getCaseTypeLabel(caseItem.type)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusMeta.badgeClassName}`}>{statusMeta.label}</span>
          {nextTask ? <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">Scadenza {formatDateIt(nextTask.due_date)}</span> : null}
        </div>
      </div>
    </Link>
  )
}

export default async function CasesPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  if (!hasSupabaseConfig()) return <SetupNotice />

  const params = (await searchParams) ?? {}
  const q = (getParam(params, 'q') ?? '').trim().toLowerCase()
  const status = getParam(params, 'status') ?? 'all'
  const type = getParam(params, 'type') ?? 'all'
  const view = getParam(params, 'view') ?? 'list'

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cases')
    .select('*, contacts(first_name, last_name, fiscal_code), tasks(id, title, due_date, is_completed)')
    .order('created_at', { ascending: false })

  const cases = Array.isArray(data) ? data as CaseRecord[] : []
  const filteredCases = cases.filter(caseItem => {
    const haystack = [caseItem.title, caseItem.description, caseItem.contacts?.first_name, caseItem.contacts?.last_name, caseItem.contacts?.fiscal_code].filter(Boolean).join(' ').toLowerCase()
    return (!q || haystack.includes(q)) && (status === 'all' || caseItem.status === status) && (type === 'all' || caseItem.type === type)
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Pratiche</h1>
          <p className="mt-1 text-sm text-slate-500">Controlla avanzamento, documenti mancanti e scadenze operative.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Link href="/cases/export" download className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
            <Download size={16} aria-hidden="true" />
            Esporta CSV
          </Link>
          <Link href="/cases/new" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
            <Plus size={16} aria-hidden="true" />
            Nuova Pratica
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <form className="grid grid-cols-1 gap-3 border-b border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_190px_190px_170px_auto] lg:p-5">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search size={17} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input name="q" defaultValue={q} placeholder="Cerca per titolo pratica, cliente o codice fiscale..." className="block w-full rounded-md border border-slate-300 py-2.5 pl-10 pr-3 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-sm" />
          </div>
          <select name="status" defaultValue={status} className="rounded-md border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-sm">
            <option value="all">Tutti gli stati</option>
            {CASE_STATUSES.map(item => <option key={item} value={item}>{CASE_STATUS_META[item].label}</option>)}
          </select>
          <select name="type" defaultValue={type} className="rounded-md border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-sm">
            <option value="all">Tutti i servizi</option>
            {CASE_TYPES.map(item => <option key={item} value={item}>{CASE_TYPE_META[item].label}</option>)}
          </select>
          <select name="view" defaultValue={view} className="rounded-md border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-sm">
            <option value="list">Vista lista</option>
            <option value="pipeline">Vista pipeline</option>
          </select>
          <button className="inline-flex min-h-11 items-center justify-center rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Filtra</button>
        </form>

        {error ? (
          <div className="p-8 text-center text-sm text-red-600">Errore nel caricamento delle pratiche: {error.message}</div>
        ) : filteredCases.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
              <FolderKanban size={20} aria-hidden="true" />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-700">Nessuna pratica trovata</p>
            <p className="mt-1 text-sm text-slate-500">Crea la prima pratica dopo aver inserito almeno un contatto.</p>
          </div>
        ) : view === 'pipeline' ? (
          <div className="grid grid-cols-1 gap-4 p-4 xl:grid-cols-5">
            {CASE_STATUSES.map(columnStatus => {
              const columnCases = filteredCases.filter(caseItem => caseItem.status === columnStatus)
              return (
                <section key={columnStatus} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h2 className="text-sm font-bold text-slate-800">{CASE_STATUS_META[columnStatus].label}</h2>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-500">{columnCases.length}</span>
                  </div>
                  <div className="space-y-3">
                    {columnCases.length ? columnCases.map(caseItem => <CaseCard key={caseItem.id} caseItem={caseItem} />) : <p className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-center text-xs text-slate-500">Nessuna pratica in questo stato.</p>}
                  </div>
                </section>
              )
            })}
          </div>
        ) : (
          <>
            <div className="space-y-3 p-3 md:hidden">
              {filteredCases.map(caseItem => <CaseCard key={caseItem.id} caseItem={caseItem} />)}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">Titolo</th>
                    <th scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">Contatto</th>
                    <th scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">Tipo</th>
                    <th scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">Stato</th>
                    <th scope="col" className="px-5 py-3 text-right text-xs font-semibold uppercase text-slate-500">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredCases.map(caseItem => {
                    const statusMeta = getCaseStatusMeta(caseItem.status)
                    return (
                      <tr key={caseItem.id} className="hover:bg-slate-50">
                        <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-950">{caseItem.title}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{caseItem.contacts ? `${caseItem.contacts.last_name} ${caseItem.contacts.first_name}` : 'N/D'}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{getCaseTypeLabel(caseItem.type)}</td>
                        <td className="whitespace-nowrap px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusMeta.badgeClassName}`}>{statusMeta.label}</span></td>
                        <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold"><Link href={getCaseDetailHref(caseItem)} className="text-blue-700 hover:text-blue-900">Dettagli</Link></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
