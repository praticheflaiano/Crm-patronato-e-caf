import Link from 'next/link'
import { AlertTriangle, CalendarDays, CheckCircle2, Clock, FileWarning, Plus, Users } from 'lucide-react'
import { SetupNotice } from '@/components/setup-notice'
import { getCaseStatusMeta, getCaseTypeLabel } from '@/lib/case-workflow'
import { formatDateIt, isPastDate, isTodayDate, isWithinNextDays } from '@/lib/date-utils'
import { hasSupabaseConfig } from '@/utils/supabase/config'
import { createClient } from '@/utils/supabase/server'

type AnyRecord = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

function StatCard({ label, value, helper, tone = 'slate' }: { label: string; value: number; helper: string; tone?: 'slate' | 'red' | 'amber' | 'blue' | 'emerald' }) {
  const tones = {
    slate: 'bg-slate-50 text-slate-700 ring-slate-200',
    red: 'bg-red-50 text-red-700 ring-red-200',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200',
    blue: 'bg-blue-50 text-blue-700 ring-blue-200',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  }
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${tones[tone]}`}>{label}</div>
      <div className="mt-4 text-3xl font-bold tracking-tight text-slate-950">{value}</div>
      <p className="mt-1 text-sm text-slate-500">{helper}</p>
    </div>
  )
}

export default async function DashboardPage() {
  if (!hasSupabaseConfig()) return <SetupNotice />

  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)

  const [contactsResult, casesResult, tasksResult, invalidityResult, certificatesResult] = await Promise.all([
    supabase.from('contacts').select('*', { count: 'exact', head: true }),
    supabase.from('cases').select('id, title, status, type, created_at, updated_at, contacts(first_name, last_name, fiscal_code)').order('updated_at', { ascending: false }).limit(40),
    supabase.from('tasks').select('*, cases(id, title, status, type, contacts(first_name, last_name, fiscal_code))').order('due_date', { ascending: true, nullsFirst: false }).limit(60),
    supabase.from('invalidity_details').select('*').limit(80),
    supabase.from('medical_certificates').select('id, case_id, expiry_date, verification_status, cases(id, title, contacts(first_name, last_name))').limit(80),
  ])

  const cases = Array.isArray(casesResult.data) ? casesResult.data as AnyRecord[] : []
  const tasks = Array.isArray(tasksResult.data) ? tasksResult.data as AnyRecord[] : []
  const invalidityDetails = Array.isArray(invalidityResult.data) ? invalidityResult.data as AnyRecord[] : []
  const certificates = Array.isArray(certificatesResult.data) ? certificatesResult.data as AnyRecord[] : []

  const openCases = cases.filter(item => item.status !== 'completed' && item.status !== 'rejected')
  const pendingDocs = cases.filter(item => item.status === 'pending_documents')
  const activeTasks = tasks.filter(task => !task.is_completed)
  const overdueTasks = activeTasks.filter(task => isPastDate(task.due_date))
  const todayTasks = activeTasks.filter(task => isTodayDate(task.due_date))
  const weekTasks = activeTasks.filter(task => isWithinNextDays(task.due_date, 7))
  const expiringCertificates = certificates.filter(item => item.expiry_date && isWithinNextDays(item.expiry_date, 30))
  const inpsVisits = invalidityDetails.filter(item => item.inps_visit_date && item.inps_visit_date >= today)
  const ap70Open = invalidityDetails.filter(item => item.ap70_filed === false)

  const urgentTasks = [...overdueTasks, ...todayTasks.filter(task => !overdueTasks.some(overdue => overdue.id === task.id))].slice(0, 6)
  const recentCases = cases.slice(0, 6)

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Priorità di oggi</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Scadenze, pratiche da sbloccare e attività operative del Centro. Questa schermata serve per capire cosa fare subito.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Link href="/contacts/new" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
            <Users size={16} /> Nuovo contatto
          </Link>
          <Link href="/cases/new" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
            <Plus size={16} /> Nuova pratica
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <StatCard label="Task scaduti" value={overdueTasks.length} helper="Da recuperare" tone={overdueTasks.length ? 'red' : 'emerald'} />
        <StatCard label="Oggi" value={todayTasks.length} helper="Attività in giornata" tone={todayTasks.length ? 'amber' : 'emerald'} />
        <StatCard label="7 giorni" value={weekTasks.length} helper="Prossime scadenze" tone="blue" />
        <StatCard label="Doc. mancanti" value={pendingDocs.length} helper="Pratiche bloccate" tone={pendingDocs.length ? 'amber' : 'emerald'} />
        <StatCard label="Aperte" value={openCases.length} helper={`${contactsResult.count ?? 0} contatti`} tone="slate" />
        <StatCard label="Sanitarie" value={expiringCertificates.length + inpsVisits.length + ap70Open.length} helper="Certificati/AP70/visite" tone="blue" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
            <div>
              <h2 className="text-base font-bold text-slate-950">Da fare adesso</h2>
              <p className="text-sm text-slate-500">Telefonate, solleciti e attività da non perdere.</p>
            </div>
            <Link href="/tasks" className="text-sm font-semibold text-blue-700 hover:text-blue-900">Apri scadenziario</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {urgentTasks.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                <CheckCircle2 className="mx-auto mb-3 text-emerald-500" size={28} />
                Nessuna urgenza per oggi. Puoi concentrarti sulle nuove richieste o completare le pratiche in lavorazione.
              </div>
            ) : urgentTasks.map(task => (
              <Link key={task.id} href={task.case_id ? `/cases/${task.case_id}` : '/tasks'} className="block px-4 py-4 hover:bg-slate-50 sm:px-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold text-slate-950">{task.title}</p>
                    <p className="mt-1 break-words text-xs text-slate-500">{task.cases?.title || 'Attività generale'}</p>
                  </div>
                  <span className={`inline-flex shrink-0 items-center gap-1 self-start rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${isPastDate(task.due_date) ? 'bg-red-50 text-red-700 ring-red-200' : 'bg-amber-50 text-amber-700 ring-amber-200'}`}>
                    <Clock size={13} /> {formatDateIt(task.due_date)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
            <h2 className="text-base font-bold text-slate-950">Pratiche da sbloccare</h2>
            <p className="text-sm text-slate-500">Documenti mancanti e pratiche operative più recenti.</p>
          </div>
          <div className="divide-y divide-slate-100">
            {(pendingDocs.length ? pendingDocs : recentCases).slice(0, 7).map(caseItem => {
              const statusMeta = getCaseStatusMeta(caseItem.status)
              return (
                <Link key={caseItem.id} href={`/cases/${caseItem.id}`} className="block px-4 py-4 hover:bg-slate-50 sm:px-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-semibold text-slate-950">{caseItem.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {caseItem.contacts ? `${caseItem.contacts.last_name} ${caseItem.contacts.first_name}` : 'Contatto non associato'} · {getCaseTypeLabel(caseItem.type)}
                      </p>
                    </div>
                    <span className={`inline-flex shrink-0 self-start rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusMeta.badgeClassName}`}>{statusMeta.label}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      </div>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <FileWarning className="mb-3 text-amber-500" size={22} />
          <h3 className="font-bold text-slate-950">Documenti da sollecitare</h3>
          <p className="mt-1 text-sm text-slate-500">{pendingDocs.length} pratica/e in attesa di integrazione.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <CalendarDays className="mb-3 text-blue-500" size={22} />
          <h3 className="font-bold text-slate-950">Scadenze sanitarie</h3>
          <p className="mt-1 text-sm text-slate-500">{expiringCertificates.length} certificati in scadenza, {inpsVisits.length} visite INPS future.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <AlertTriangle className="mb-3 text-red-500" size={22} />
          <h3 className="font-bold text-slate-950">AP70 da chiudere</h3>
          <p className="mt-1 text-sm text-slate-500">{ap70Open.length} posizioni amministrative non completate.</p>
        </div>
      </section>
    </div>
  )
}
