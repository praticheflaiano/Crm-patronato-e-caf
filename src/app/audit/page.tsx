import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FileText, FolderKanban, History, User as UserIcon } from 'lucide-react'
import { SetupNotice } from '@/components/setup-notice'
import { formatDateIt } from '@/lib/date-utils'
import { hasSupabaseConfig } from '@/utils/supabase/config'
import { createClient } from '@/utils/supabase/server'

type AnyRecord = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

const actionMeta: Record<string, { label: string; className: string }> = {
  INSERT: { label: 'Creato', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  UPDATE: { label: 'Modificato', className: 'bg-amber-50 text-amber-700 ring-amber-200' },
  DELETE: { label: 'Eliminato', className: 'bg-red-50 text-red-700 ring-red-200' },
}

const tableMeta: Record<string, { label: string; icon: typeof FolderKanban; href?: (id: string) => string }> = {
  cases: { label: 'Pratica', icon: FolderKanban, href: (id) => `/cases/${id}` },
  contacts: { label: 'Contatto', icon: UserIcon, href: (id) => `/contacts/${id}` },
  documents: { label: 'Documento', icon: FileText },
}

function formatDateTimeIt(value: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return formatDateIt(value)
  return date.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default async function AuditPage() {
  if (!hasSupabaseConfig()) return <SetupNotice />

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [auditResult, profilesResult] = await Promise.all([
    supabase.from('audit_log').select('id, table_name, record_id, action, actor_id, created_at').order('created_at', { ascending: false }).limit(100),
    supabase.from('profiles').select('id, full_name'),
  ])

  const entries = Array.isArray(auditResult.data) ? (auditResult.data as AnyRecord[]) : []
  const profiles = Array.isArray(profilesResult.data) ? (profilesResult.data as AnyRecord[]) : []
  const nameById = new Map<string, string>(profiles.map((p) => [p.id, p.full_name || '']))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Registro attività</h1>
        <p className="mt-1 text-sm text-slate-500">Traccia delle modifiche su pratiche, contatti e documenti della tua organizzazione.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {entries.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
              <History size={20} aria-hidden="true" />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-700">Nessuna attività registrata</p>
            <p className="mt-1 text-sm text-slate-500">Le modifiche future a pratiche, contatti e documenti compariranno qui.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {entries.map((entry) => {
              const action = actionMeta[entry.action] ?? { label: entry.action, className: 'bg-slate-50 text-slate-700 ring-slate-200' }
              const table = tableMeta[entry.table_name] ?? { label: entry.table_name, icon: History }
              const Icon = table.icon
              const actor = entry.actor_id ? nameById.get(entry.actor_id) || 'Utente' : 'Sistema'
              const href = table.href && entry.record_id ? table.href(entry.record_id) : null

              const content = (
                <div className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <Icon size={16} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-950">{table.label}</span>
                      <span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${action.className}`}>{action.label}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {actor} · {formatDateTimeIt(entry.created_at)}
                    </p>
                  </div>
                </div>
              )

              return (
                <li key={entry.id}>
                  {href ? (
                    <Link href={href} className="block hover:bg-slate-50">
                      {content}
                    </Link>
                  ) : (
                    content
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
