import Link from 'next/link'
import { BarChart3, FileText, FolderKanban, Stethoscope, Users } from 'lucide-react'
import { SetupNotice } from '@/components/setup-notice'
import { CASE_STATUSES, CASE_STATUS_META, CASE_TYPES, CASE_TYPE_META, getCaseStatusMeta, getCaseTypeLabel } from '@/lib/case-workflow'
import { isPastDate, isWithinNextDays } from '@/lib/date-utils'
import { hasSupabaseConfig } from '@/utils/supabase/config'
import { createClient } from '@/utils/supabase/server'

type AnyRecord = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

function Bar({ label, value, total, className }: { label: string; value: number; total: number; className: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="tabular-nums text-slate-500">{value} · {pct}%</span>
      </div>
      <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${className}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default async function ReportPage() {
  if (!hasSupabaseConfig()) return <SetupNotice />

  const supabase = await createClient()
  const [contactsRes, casesRes, tasksRes, certsRes] = await Promise.all([
    supabase.from('contacts').select('id', { count: 'exact', head: true }),
    supabase.from('cases').select('id, status, type, created_at'),
    supabase.from('tasks').select('id, is_completed, due_date'),
    supabase.from('medical_certificates').select('id, expiry_date, verification_status'),
  ])

  const cases = Array.isArray(casesRes.data) ? (casesRes.data as AnyRecord[]) : []
  const tasks = Array.isArray(tasksRes.data) ? (tasksRes.data as AnyRecord[]) : []
  const certs = Array.isArray(certsRes.data) ? (certsRes.data as AnyRecord[]) : []

  const totalCases = cases.length
  const openCases = cases.filter((c) => c.status !== 'completed' && c.status !== 'rejected').length
  const completedCases = cases.filter((c) => c.status === 'completed').length
  const completionRate = totalCases > 0 ? Math.round((completedCases / totalCases) * 100) : 0

  const openTasks = tasks.filter((t) => !t.is_completed)
  const overdueTasks = openTasks.filter((t) => isPastDate(t.due_date)).length
  const expiringCerts = certs.filter((c) => c.expiry_date && isWithinNextDays(c.expiry_date, 30)).length

  // Cases created in the current calendar month
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const newThisMonth = cases.filter((c) => (c.created_at ?? '') >= monthStart).length

  const byStatus = CASE_STATUSES.map((s) => ({ key: s, label: CASE_STATUS_META[s].label, value: cases.filter((c) => c.status === s).length }))
  const byType = CASE_TYPES.map((t) => ({ key: t, label: CASE_TYPE_META[t].label, value: cases.filter((c) => c.type === t).length }))

  const stats = [
    { label: 'Contatti totali', value: contactsRes.count ?? 0, icon: Users, tone: 'text-slate-700 bg-slate-100' },
    { label: 'Pratiche aperte', value: openCases, icon: FolderKanban, tone: 'text-blue-700 bg-blue-100' },
    { label: 'Nuove questo mese', value: newThisMonth, icon: BarChart3, tone: 'text-emerald-700 bg-emerald-100' },
    { label: 'Tasso completamento', value: `${completionRate}%`, icon: FileText, tone: 'text-indigo-700 bg-indigo-100' },
    { label: 'Scadenze in ritardo', value: overdueTasks, icon: FileText, tone: overdueTasks ? 'text-red-700 bg-red-100' : 'text-emerald-700 bg-emerald-100' },
    { label: 'Certificati in scadenza', value: expiringCerts, icon: Stethoscope, tone: expiringCerts ? 'text-amber-700 bg-amber-100' : 'text-emerald-700 bg-emerald-100' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Report e statistiche</h1>
        <p className="mt-1 text-sm text-slate-500">Una panoramica dell&apos;attività del Centro: pratiche, scadenze e iter sanitari.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${s.tone}`}>
                <Icon size={18} aria-hidden="true" />
              </div>
              <p className="mt-3 text-2xl font-bold tracking-tight text-slate-950">{s.value}</p>
              <p className="mt-1 text-sm text-slate-500">{s.label}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-950">Pratiche per stato</h2>
          <div className="mt-4 space-y-3">
            {byStatus.map((row) => (
              <Bar key={row.key} label={row.label} value={row.value} total={totalCases} className={getCaseStatusMeta(row.key).badgeClassName.includes('emerald') ? 'bg-emerald-500' : getCaseStatusMeta(row.key).badgeClassName.includes('red') || getCaseStatusMeta(row.key).badgeClassName.includes('rose') ? 'bg-rose-500' : getCaseStatusMeta(row.key).badgeClassName.includes('amber') || getCaseStatusMeta(row.key).badgeClassName.includes('orange') ? 'bg-amber-500' : 'bg-sky-500'} />
            ))}
            {totalCases === 0 && <p className="text-sm text-slate-500">Nessuna pratica registrata.</p>}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-950">Pratiche per servizio</h2>
          <div className="mt-4 space-y-3">
            {byType.map((row) => (
              <Bar key={row.key} label={row.label} value={row.value} total={totalCases} className="bg-blue-500" />
            ))}
            {totalCases === 0 && <p className="text-sm text-slate-500">Nessuna pratica registrata.</p>}
          </div>
          <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            {byType.filter((r) => r.value > 0).map((r) => (
              <Link key={r.key} href={`/cases?type=${r.key}`} className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                {getCaseTypeLabel(r.key)} ({r.value})
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
