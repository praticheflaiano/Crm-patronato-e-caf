import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Edit, ExternalLink, FileWarning, FolderKanban, Phone, PlayCircle, RotateCcw, ShieldCheck } from 'lucide-react'
import { CaseDocuments } from '@/components/documents/case-documents'
import TaskForm from '@/components/tasks/TaskForm'
import TaskList from '@/components/tasks/TaskList'
import { SetupNotice } from '@/components/setup-notice'
import { getAllowedNextStatuses, getCaseStatusMeta, type CaseStatus } from '@/lib/case-workflow'
import { formatDateIt } from '@/lib/date-utils'
import { TARI_DOCUMENT_CHECKLISTS, TARI_MODULE_MAP, TARI_OFFICIAL_SOURCES, TARI_WORKFLOW_STEPS } from '@/lib/tari'
import { hasSupabaseConfig } from '@/utils/supabase/config'
import { createClient } from '@/utils/supabase/server'
import { updateTariCaseStatus } from './actions'

type TariContact = {
  id: string
  first_name: string
  last_name: string
  fiscal_code: string
  email: string | null
  phone: string | null
  address: string | null
}

type TariDocument = {
  id: string
  file_name: string
  file_size: number | null
  file_type: string | null
  created_at: string | null
}

type TariTask = {
  id: string
  title: string
  due_date: string | null
  is_completed: boolean | null
}

type TariCaseRecord = {
  id: string
  title: string
  description: string | null
  status: CaseStatus | null
  created_at: string | null
  contacts: TariContact | null
  documents: TariDocument[] | null
  tasks: TariTask[] | null
}

function actionLabel(status: CaseStatus) {
  const labels = {
    open: 'Riapri pratica',
    in_progress: 'Avvia lavorazione',
    pending_documents: 'Richiedi documenti TARI',
    completed: 'Chiudi pratica TARI',
    rejected: 'Segna non procedibile',
  } satisfies Record<CaseStatus, string>
  return labels[status]
}

function actionIcon(status: CaseStatus) {
  if (status === 'in_progress') return <PlayCircle size={16} aria-hidden="true" />
  if (status === 'pending_documents') return <FileWarning size={16} aria-hidden="true" />
  if (status === 'completed') return <CheckCircle2 size={16} aria-hidden="true" />
  return <RotateCcw size={16} aria-hidden="true" />
}

function MetricCard({ label, value, helper }: { label: string; value: number | string; helper: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{helper}</p>
    </div>
  )
}

export default async function TariCaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabaseConfig()) return <SetupNotice />

  const { id } = await params
  const supabase = await createClient()
  const { data: caseItemRaw, error } = await supabase
    .from('cases')
    .select('*, contacts(*), documents(*), tasks(*)')
    .eq('id', id)
    .eq('type', 'tari')
    .single()

  if (error || !caseItemRaw) notFound()

  const caseItem = caseItemRaw as unknown as TariCaseRecord
  const statusMeta = getCaseStatusMeta(caseItem.status)
  const nextStatuses = getAllowedNextStatuses(caseItem.status)
  const documents = caseItem.documents ?? []
  const tasks = caseItem.tasks ?? []
  const openTasks = tasks.filter((task) => !task.is_completed)
  const nextTask = openTasks
    .filter((task) => task.due_date)
    .sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)))[0]

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <Link href="/tari" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900">
            <ArrowLeft size={16} aria-hidden="true" />
            Torna al portale TARI
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">TARI Roma / AMA</span>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${statusMeta.badgeClassName}`}>{statusMeta.label}</span>
          </div>
          <h1 className="mt-3 break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{caseItem.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Pratica creat{caseItem.created_at ? `a il ${formatDateIt(caseItem.created_at)}` : 'a'} · Fonti operative AMA/Roma Capitale integrate
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href={`/cases/${caseItem.id}/edit`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
            <Edit size={16} aria-hidden="true" />
            Modifica dati base
          </Link>
          <Link href={`/cases/${caseItem.id}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
            <FolderKanban size={16} aria-hidden="true" />
            Vista CRM
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <MetricCard label="Documenti" value={documents.length} helper="Allegati caricati nella pratica" />
        <MetricCard label="Task aperti" value={openTasks.length} helper={nextTask?.due_date ? `Prossima: ${formatDateIt(nextTask.due_date)}` : 'Nessuna scadenza datata'} />
        <MetricCard label="Fonti" value={TARI_OFFICIAL_SOURCES.length} helper="Riferimenti ufficiali AMA/Roma" />
      </div>

      <section className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" />
            <div>
              <h2 className="text-sm font-bold text-blue-950">Controllo qualità TARI</h2>
              <p className="mt-1 text-sm leading-6 text-blue-900">
                Prima dell’invio verifica sempre modulo AMA corretto, dati immobile, decorrenze, allegati e ricevuta/protocollo. Non chiudere la pratica senza archiviare l’output o la motivazione operativa.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            {nextStatuses.map((status) => (
              <form key={status} action={updateTariCaseStatus}>
                <input type="hidden" name="id" value={caseItem.id} />
                <input type="hidden" name="status" value={status} />
                <button type="submit" className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-100 sm:w-auto">
                  {actionIcon(status)}
                  {actionLabel(status)}
                </button>
              </form>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
        <main className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-slate-950">Analisi pratica</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contribuente</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {caseItem.contacts ? `${caseItem.contacts.last_name} ${caseItem.contacts.first_name}` : 'Contatto non associato'}
                </p>
                {caseItem.contacts?.fiscal_code ? <p className="mt-1 text-sm text-slate-600">CF {caseItem.contacts.fiscal_code}</p> : null}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Indirizzo collegato</p>
                <p className="mt-1 text-sm text-slate-700">{caseItem.contacts?.address || 'Da indicare nelle note/documenti della pratica'}</p>
              </div>
            </div>
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Note operative</p>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{caseItem.description || 'Nessuna nota operativa ancora inserita.'}</p>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
              <h2 className="text-lg font-bold text-slate-950">Checklist documentale TARI</h2>
              <p className="mt-1 text-sm text-slate-500">Usala per decidere se mettere la pratica in attesa documenti o procedere all’invio.</p>
            </div>
            <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-3">
              {TARI_DOCUMENT_CHECKLISTS.map((block) => (
                <article key={block.title} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-950">{block.title}</h3>
                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                    {block.bullets.map((bullet) => (
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

          <CaseDocuments caseId={caseItem.id} documents={documents} />

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
              <h2 className="text-lg font-bold text-slate-950">Workflow consigliato</h2>
              <p className="mt-1 text-sm text-slate-500">Sequenza operativa sintetica da seguire per ogni pratica TARI Roma/AMA.</p>
            </div>
            <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-2">
              {TARI_WORKFLOW_STEPS.map((step) => (
                <article key={step.title} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-950">{step.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{step.summary}</p>
                </article>
              ))}
            </div>
          </section>
        </main>

        <aside className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-lg font-bold text-slate-950">Cliente</h2>
            {caseItem.contacts ? (
              <div className="mt-4 space-y-2 text-sm text-slate-700">
                <p className="break-words"><strong>Nome:</strong> {caseItem.contacts.last_name} {caseItem.contacts.first_name}</p>
                <p className="break-words"><strong>CF:</strong> {caseItem.contacts.fiscal_code}</p>
                {caseItem.contacts.email ? <p className="break-all"><strong>Email:</strong> {caseItem.contacts.email}</p> : null}
                {caseItem.contacts.phone ? <p><strong>Telefono:</strong> {caseItem.contacts.phone}</p> : null}
                <div className="grid grid-cols-1 gap-2 pt-3">
                  {caseItem.contacts.phone ? <a href={`tel:${caseItem.contacts.phone}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"><Phone size={15} /> Chiama cliente</a> : null}
                  <Link href={`/contacts/${caseItem.contacts.id}`} className="inline-flex min-h-10 items-center justify-center rounded-md bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100">Vedi profilo completo</Link>
                </div>
              </div>
            ) : <p className="mt-3 text-sm text-slate-500">Nessun contatto associato.</p>}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-lg font-bold text-slate-950">Aggiungi scadenza</h2>
            <p className="mt-1 text-sm text-slate-500">Sollecito documenti, verifica modulo AMA, invio PEC o controllo ricevuta.</p>
            <div className="mt-4">
              <TaskForm caseId={caseItem.id} compact />
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-lg font-bold text-slate-950">Task pratica</h2>
            <div className="mt-4">
              <TaskList caseId={caseItem.id} />
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
              <h2 className="text-lg font-bold text-slate-950">Fonti ufficiali</h2>
              <p className="mt-1 text-sm text-slate-500">Da ricontrollare prima di invii sensibili.</p>
            </div>
            <div className="space-y-3 p-4 sm:p-5">
              {TARI_OFFICIAL_SOURCES.slice(0, 5).map((source) => (
                <a key={source.href} href={source.href} target="_blank" rel="noreferrer" className="block rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm hover:border-blue-200 hover:bg-blue-50">
                  <span className="flex items-start justify-between gap-2 font-semibold text-slate-950">
                    {source.title}
                    <ExternalLink size={14} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">{source.note}</span>
                </a>
              ))}
              <Link href="/tari" className="inline-flex text-sm font-semibold text-blue-700 hover:text-blue-900">Vedi tutte le fonti nel portale TARI</Link>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
              <h2 className="text-lg font-bold text-slate-950">Moduli AMA frequenti</h2>
            </div>
            <div className="space-y-3 p-4 sm:p-5">
              {TARI_MODULE_MAP.slice(0, 5).map((module) => (
                <article key={module.code} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{module.code}</p>
                  <h3 className="mt-1 text-sm font-semibold text-slate-950">{module.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{module.useCase}</p>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
