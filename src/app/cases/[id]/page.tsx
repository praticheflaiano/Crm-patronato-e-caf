import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Edit, FileWarning, Phone, PlayCircle, RotateCcw } from 'lucide-react'
import { CaseDocuments } from '@/components/documents/case-documents'
import TaskForm from '@/components/tasks/TaskForm'
import TaskList from '@/components/tasks/TaskList'
import { SetupNotice } from '@/components/setup-notice'
import { getAllowedNextStatuses, getCaseStatusMeta, getCaseTypeLabel, type CaseStatus } from '@/lib/case-workflow'
import { hasSupabaseConfig } from '@/utils/supabase/config'
import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { updateCaseStatus } from './actions'

function actionLabel(status: CaseStatus) {
  const labels = {
    open: 'Riapri pratica',
    in_progress: 'Avvia lavorazione',
    pending_documents: 'Richiedi documenti mancanti',
    completed: 'Completa pratica',
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

// Semantic styling so the operator instantly recognises the positive path
// (advance/complete) versus the blocking or negative ones.
function actionStyle(status: CaseStatus) {
  const styles = {
    open: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
    in_progress: 'border border-transparent bg-blue-600 text-white hover:bg-blue-700',
    pending_documents: 'border border-transparent bg-amber-500 text-white hover:bg-amber-600',
    completed: 'border border-transparent bg-emerald-600 text-white hover:bg-emerald-700',
    rejected: 'border border-red-300 bg-white text-red-700 hover:bg-red-50',
  } satisfies Record<CaseStatus, string>
  return styles[status]
}

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabaseConfig()) return <SetupNotice />

  const { id } = await params
  const supabase = await createClient()
  const { data: caseItemRaw, error } = await supabase
    .from('cases')
    .select('*, contacts(*), documents(*), tasks(*)')
    .eq('id', id)
    .single()

  if (error || !caseItemRaw) notFound()

  const caseItem = caseItemRaw as any /* eslint-disable-line @typescript-eslint/no-explicit-any */
  const statusMeta = getCaseStatusMeta(caseItem.status)
  const nextStatuses = getAllowedNextStatuses(caseItem.status as CaseStatus | null)
  const openTasks = Array.isArray(caseItem.tasks) ? caseItem.tasks.filter((task: any) => !task.is_completed).length : 0 // eslint-disable-line @typescript-eslint/no-explicit-any

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <Link href="/cases" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900">
            <ArrowLeft size={16} aria-hidden="true" />
            Indietro alle pratiche
          </Link>
          <h1 className="mt-3 break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{caseItem.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{getCaseTypeLabel(caseItem.type)} · Creata il {caseItem.created_at ? new Date(caseItem.created_at).toLocaleDateString('it-IT') : 'N/D'}</p>
        </div>
        <Link href={`/cases/${caseItem.id}/edit`} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 sm:w-auto">
          <Edit size={16} aria-hidden="true" />
          Modifica
        </Link>
      </div>

      {caseItem.type === 'tari' ? (
        <section className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-blue-950">Scheda verticale TARI disponibile</h2>
              <p className="mt-1 text-sm text-blue-900">Apri la vista dedicata con checklist documentale, fonti AMA Roma e workflow TARI.</p>
            </div>
            <Link href={`/tari/${caseItem.id}`} className="inline-flex min-h-10 items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
              Apri scheda TARI
            </Link>
          </div>
        </section>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-950">Prossima azione</h2>
            <p className="mt-1 text-sm text-slate-500">
              {caseItem.status === 'pending_documents'
                ? 'Pratica bloccata: attendiamo integrazione documenti dal cittadino.'
                : openTasks > 0
                  ? `${openTasks} attività aperta/e collegate alla pratica.`
                  : 'Nessuna attività aperta: scegli il prossimo passaggio operativo.'}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            {nextStatuses.map((status) => {
              return (
                <form key={status} action={updateCaseStatus}>
                  <input type="hidden" name="id" value={caseItem.id} />
                  <input type="hidden" name="status" value={status} />
                  <button type="submit" className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold shadow-sm sm:w-auto ${actionStyle(status)}`}>
                    {actionIcon(status)}
                    {actionLabel(status)}
                  </button>
                </form>
              )
            })}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-6">
        <div className="space-y-5 lg:col-span-2 lg:space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="break-words text-xl font-bold text-slate-950">{caseItem.title}</h2>
                <p className="mt-1 text-sm text-slate-500">Tipo pratica: <strong>{getCaseTypeLabel(caseItem.type)}</strong></p>
              </div>
              <span className={`inline-flex shrink-0 self-start rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset ${statusMeta.badgeClassName}`}>{statusMeta.label}</span>
            </div>
            <div className="mt-4 border-t border-slate-100 pt-4">
              <h3 className="text-sm font-semibold text-slate-700">Descrizione / note operative</h3>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{caseItem.description || 'Nessuna descrizione.'}</p>
            </div>
          </section>

          <CaseDocuments caseId={caseItem.id} documents={caseItem.documents ?? []} />
        </div>

        <aside className="space-y-5 lg:space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-slate-950">Cliente</h2>
            {caseItem.contacts ? (
              <div className="mt-4 space-y-2 text-sm text-slate-700">
                <p className="break-words"><strong>Nome:</strong> {caseItem.contacts.last_name} {caseItem.contacts.first_name}</p>
                <p className="break-words"><strong>CF:</strong> {caseItem.contacts.fiscal_code}</p>
                {caseItem.contacts.email && <p className="break-all"><strong>Email:</strong> {caseItem.contacts.email}</p>}
                {caseItem.contacts.phone && <p><strong>Telefono:</strong> {caseItem.contacts.phone}</p>}
                <div className="grid grid-cols-1 gap-2 pt-3">
                  {caseItem.contacts.phone ? <a href={`tel:${caseItem.contacts.phone}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"><Phone size={15} /> Chiama cliente</a> : null}
                  <Link href={`/contacts/${caseItem.contacts.id}`} className="inline-flex min-h-10 items-center justify-center rounded-md bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100">Vedi profilo completo</Link>
                </div>
              </div>
            ) : <p className="mt-3 text-sm text-slate-500">Nessun contatto associato.</p>}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-slate-950">Aggiungi promemoria</h2>
            <p className="mt-1 text-sm text-slate-500">Telefonata, documento da richiedere o scadenza interna.</p>
            <div className="mt-4">
              <TaskForm caseId={caseItem.id} compact />
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-slate-950">Task pratica</h2>
            <div className="mt-4">
              <TaskList caseId={caseItem.id} />
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
