import Link from 'next/link'
import { ArrowRight, BookOpen, CalendarDays, FolderKanban, Plus, ShieldCheck } from 'lucide-react'
import { SetupNotice } from '@/components/setup-notice'
import { getCaseStatusMeta, getCaseTypeLabel } from '@/lib/case-workflow'
import { formatDateIt } from '@/lib/date-utils'
import {
  TARI_ARCHIVING_TEMPLATE,
  TARI_DOCUMENT_CHECKLISTS,
  TARI_MODULE_MAP,
  TARI_OFFICIAL_SOURCES,
  TARI_WORKFLOW_STEPS,
} from '@/lib/tari'
import { hasSupabaseConfig } from '@/utils/supabase/config'
import { createClient } from '@/utils/supabase/server'

type TariCaseRecord = {
  id: string
  title: string
  status: string | null
  created_at: string | null
  description: string | null
  contacts: {
    first_name: string
    last_name: string
    fiscal_code: string
  } | null
}

function StatCard({ label, value, helper }: { label: string; value: number; helper: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{value}</div>
      <p className="mt-1 text-sm text-slate-500">{helper}</p>
    </div>
  )
}

export default async function TariPage() {
  if (!hasSupabaseConfig()) return <SetupNotice />

  const supabase = await createClient()
  const { data: casesRaw, count } = await supabase
    .from('cases')
    .select('id, title, status, created_at, description, contacts(first_name, last_name, fiscal_code)', { count: 'exact' })
    .eq('type', 'tari')
    .order('created_at', { ascending: false })
    .limit(12)

  const tariCases = Array.isArray(casesRaw) ? (casesRaw as TariCaseRecord[]) : []
  const openCases = tariCases.filter((item) => item.status !== 'completed' && item.status !== 'rejected')
  const pendingDocs = tariCases.filter((item) => item.status === 'pending_documents')
  const recentCases = tariCases.slice(0, 6)

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Modulo verticale integrato</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">TARI Roma / AMA</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Area consultiva e operativa integrata nel CRM per pratiche TARI di Roma. Qui trovi fonti ufficiali, flusso operativo,
            modulistica più usata e accesso rapido alle pratiche già aperte.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/cases/new?type=tari" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
            <Plus size={16} aria-hidden="true" />
            Nuova pratica TARI
          </Link>
          <Link href="/cases?type=tari" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
            <FolderKanban size={16} aria-hidden="true" />
            Elenco pratiche
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Pratiche TARI" value={count ?? tariCases.length} helper="Totale pratiche classificate come TARI" />
        <StatCard label="Aperte" value={openCases.length} helper="Pratiche non ancora chiuse" />
        <StatCard label="Documenti mancanti" value={pendingDocs.length} helper="Pratiche in attesa di integrazione" />
      </div>

      <section className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
              <ShieldCheck size={14} aria-hidden="true" />
              Regola operativa
            </div>
            <p className="mt-3 text-sm leading-6 text-blue-900">
              Per ogni pratica TARI usa sempre la fonte ufficiale aggiornata, archivia i documenti con ordine cronologico e conserva i protocolli.
              Se un modulo non è chiaramente compilabile, verifica il PDF ufficiale prima di procedere.
            </p>
          </div>
          <Link href="/chat" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-100">
            <BookOpen size={16} aria-hidden="true" />
            Chiedi all’assistente
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
            <h2 className="text-base font-bold text-slate-950">Fonti ufficiali da consultare</h2>
            <p className="text-sm text-slate-500">Le fonti vanno ricontrollate prima di pratiche sensibili o in prossimità di cambi normativi.</p>
          </div>
          <div className="grid gap-3 p-4 sm:p-5 md:grid-cols-2">
            {TARI_OFFICIAL_SOURCES.map((source) => (
              <a key={source.href} href={source.href} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm transition hover:border-blue-200 hover:bg-blue-50">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-950">{source.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{source.note}</p>
                  </div>
                  <ArrowRight size={16} className="mt-1 shrink-0 text-slate-400" aria-hidden="true" />
                </div>
                <p className="mt-3 break-all text-xs font-medium text-blue-700">{source.href}</p>
              </a>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
            <h2 className="text-base font-bold text-slate-950">Workflow operativo consigliato</h2>
            <p className="text-sm text-slate-500">Sequenza pratica per analizzare, archiviare e chiudere le pratiche TARI.</p>
          </div>
          <div className="space-y-4 p-4 sm:p-5">
            {TARI_WORKFLOW_STEPS.map((step) => (
              <article key={step.title} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-950">{step.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">{step.summary}</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {step.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" aria-hidden="true" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
            <h2 className="text-base font-bold text-slate-950">Checklist documentale</h2>
            <p className="text-sm text-slate-500">Cosa non deve mancare prima dell’invio o dell’archiviazione della pratica.</p>
          </div>
          <div className="space-y-4 p-4 sm:p-5">
            {TARI_DOCUMENT_CHECKLISTS.map((block) => (
              <article key={block.title} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-950">{block.title}</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {block.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
            <h2 className="text-base font-bold text-slate-950">Mappatura moduli AMA</h2>
            <p className="text-sm text-slate-500">I moduli più frequenti per Roma/AMA e il loro uso operativo nel CRM.</p>
          </div>
          <div className="space-y-3 p-4 sm:p-5">
            {TARI_MODULE_MAP.map((module) => (
              <article key={module.code} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{module.code}</p>
                    <h3 className="mt-1 text-sm font-semibold text-slate-950">{module.title}</h3>
                  </div>
                  <span className="inline-flex rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                    {module.useCase}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{module.note}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
          <h2 className="text-base font-bold text-slate-950">Archiviazione consigliata</h2>
          <p className="text-sm text-slate-500">Struttura semplice per conservare input, estratti e output in modo consistente.</p>
        </div>
        <div className="p-4 sm:p-5">
          <pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm leading-6 text-slate-100">
{TARI_ARCHIVING_TEMPLATE.join('\n')}
          </pre>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
          <h2 className="text-base font-bold text-slate-950">Pratiche TARI recenti</h2>
          <p className="text-sm text-slate-500">Le ultime pratiche classificate TARI aprono la scheda verticale con checklist e fonti AMA.</p>
        </div>
        <div className="divide-y divide-slate-100">
          {recentCases.length === 0 ? (
            <div className="px-4 py-10 text-center sm:px-5">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                <CalendarDays size={20} aria-hidden="true" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-700">Nessuna pratica TARI trovata</p>
              <p className="mt-1 text-sm text-slate-500">Crea la prima pratica oppure aggiorna il filtro TARI dall’elenco generale.</p>
            </div>
          ) : (
            recentCases.map((caseItem) => {
              const statusMeta = getCaseStatusMeta(caseItem.status)
              return (
                <Link key={caseItem.id} href={`/tari/${caseItem.id}`} className="block px-4 py-4 transition hover:bg-slate-50 sm:px-5">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <h3 className="break-words text-sm font-semibold text-slate-950">{caseItem.title}</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {caseItem.contacts ? `${caseItem.contacts.last_name} ${caseItem.contacts.first_name}` : 'Contatto non associato'} · {getCaseTypeLabel('tari')}
                      </p>
                      {caseItem.description ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{caseItem.description}</p> : null}
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusMeta.badgeClassName}`}>
                        {statusMeta.label}
                      </span>
                      <span className="inline-flex rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500 ring-1 ring-inset ring-slate-200">
                        {caseItem.created_at ? formatDateIt(caseItem.created_at) : 'Data N/D'}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </section>
    </div>
  )
}
