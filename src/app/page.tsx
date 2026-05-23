import { CalendarClock, CheckCircle2, FolderKanban, Users } from 'lucide-react'
import { SetupNotice } from '@/components/setup-notice'
import { hasSupabaseConfig } from '@/utils/supabase/config'
import { createClient } from '@/utils/supabase/server'

export default async function Dashboard() {
  if (!hasSupabaseConfig()) {
    return <SetupNotice />
  }

  const supabase = await createClient()
  const [contacts, openCases, pendingTasks, recentCases] = await Promise.all([
    supabase.from('contacts').select('id', { count: 'exact', head: true }),
    supabase.from('cases').select('id', { count: 'exact', head: true }).neq('status', 'completed'),
    supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('is_completed', false),
    supabase
      .from('cases')
      .select('id, title, status, type, created_at, contacts(first_name, last_name)')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const stats = [
    { label: 'Contatti totali', value: contacts.count ?? 0, icon: Users },
    { label: 'Pratiche aperte', value: openCases.count ?? 0, icon: FolderKanban },
    { label: 'Task aperti', value: pendingTasks.count ?? 0, icon: CalendarClock },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Panoramica operativa dello studio.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((item) => (
          <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-500">{item.label}</p>
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-blue-700">
                <item.icon size={18} aria-hidden="true" />
              </div>
            </div>
            <p className="mt-4 text-3xl font-bold text-slate-950">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
            <h2 className="text-sm font-semibold text-slate-950">Pratiche recenti</h2>
          </div>
          {!recentCases.data || recentCases.data.length === 0 ? (
            <div className="flex items-center gap-3 px-4 py-8 text-sm text-slate-500 sm:px-5">
              <CheckCircle2 size={18} className="text-slate-400" aria-hidden="true" />
              Nessuna pratica recente.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentCases.data.map((caseItem: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => (
                <div key={caseItem.id} className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{caseItem.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {caseItem.contacts ? `${caseItem.contacts.last_name} ${caseItem.contacts.first_name}` : 'Nessun contatto'} · {caseItem.type.replace('_', ' ')}
                    </p>
                  </div>
                  <span className="whitespace-nowrap rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                    {caseItem.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-950">Prossimi passi</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p>Completa anagrafiche clienti e crea le prime pratiche.</p>
            <p>Configura ruoli e permessi avanzati prima di caricare documenti sanitari reali.</p>
          </div>
        </section>
      </div>
    </div>
  )
}
