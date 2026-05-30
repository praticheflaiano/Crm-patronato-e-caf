import Link from 'next/link'
import { CalendarDays, CheckCircle2, Clock, Search } from 'lucide-react'
import TaskForm from '@/components/tasks/TaskForm'
import { SetupNotice } from '@/components/setup-notice'
import { formatDateIt, isPastDate, isTodayDate, isWithinNextDays } from '@/lib/date-utils'
import { hasSupabaseConfig } from '@/utils/supabase/config'
import { createClient } from '@/utils/supabase/server'

type SearchParams = Record<string, string | string[] | undefined>
type TaskRecord = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

function getParam(params: SearchParams, key: string) {
  const value = params[key]
  return Array.isArray(value) ? value[0] : value
}

function matchesFilter(task: TaskRecord, filter: string) {
  if (filter === 'completed') return Boolean(task.is_completed)
  if (task.is_completed) return false
  if (filter === 'overdue') return isPastDate(task.due_date)
  if (filter === 'today') return isTodayDate(task.due_date)
  if (filter === 'week') return isWithinNextDays(task.due_date, 7)
  return true
}

function dueClass(task: TaskRecord) {
  if (task.is_completed) return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
  if (isPastDate(task.due_date)) return 'bg-red-50 text-red-700 ring-red-200'
  if (isTodayDate(task.due_date)) return 'bg-amber-50 text-amber-700 ring-amber-200'
  return 'bg-slate-50 text-slate-700 ring-slate-200'
}

export default async function TasksPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  if (!hasSupabaseConfig()) return <SetupNotice />

  const params = (await searchParams) ?? {}
  const q = (getParam(params, 'q') ?? '').trim().toLowerCase()
  const filter = getParam(params, 'filter') ?? 'open'

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tasks')
    .select('*, cases(id, title, status, type, contacts(first_name, last_name, fiscal_code))')
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  const allTasks = Array.isArray(data) ? data as TaskRecord[] : []
  const filteredTasks = allTasks.filter(task => {
    const haystack = [task.title, task.description, task.cases?.title, task.cases?.contacts?.first_name, task.cases?.contacts?.last_name, task.cases?.contacts?.fiscal_code].filter(Boolean).join(' ').toLowerCase()
    return matchesFilter(task, filter) && (!q || haystack.includes(q))
  })

  const openTasks = allTasks.filter(task => !task.is_completed)
  const overdue = openTasks.filter(task => isPastDate(task.due_date))
  const today = openTasks.filter(task => isTodayDate(task.due_date))
  const week = openTasks.filter(task => isWithinNextDays(task.due_date, 7))

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Scadenziario</h1>
          <p className="mt-2 text-sm text-slate-500">Telefonate, solleciti documenti e attività da completare.</p>
        </div>
        <Link href="/cases" className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
          Torna alle pratiche
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { key: 'open', label: 'Aperte', value: openTasks.length, border: 'border-slate-200', bg: 'bg-white', text: 'text-slate-500', num: 'text-slate-950', ring: 'ring-slate-400' },
          { key: 'overdue', label: 'Scadute', value: overdue.length, border: 'border-red-200', bg: 'bg-red-50', text: 'text-red-600', num: 'text-red-700', ring: 'ring-red-400' },
          { key: 'today', label: 'Oggi', value: today.length, border: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-700', num: 'text-amber-700', ring: 'ring-amber-400' },
          { key: 'week', label: '7 giorni', value: week.length, border: 'border-blue-200', bg: 'bg-blue-50', text: 'text-blue-700', num: 'text-blue-700', ring: 'ring-blue-400' },
        ].map((card) => {
          const href = `/tasks?filter=${card.key}${q ? `&q=${encodeURIComponent(q)}` : ''}`
          const isActive = filter === card.key
          return (
            <Link
              key={card.key}
              href={href}
              aria-current={isActive ? 'true' : undefined}
              className={`rounded-lg border ${card.border} ${card.bg} p-4 shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 ${card.ring} ${isActive ? `ring-2 ${card.ring}` : ''}`}
            >
              <p className={`text-xs font-semibold uppercase ${card.text}`}>{card.label}</p>
              <p className={`mt-2 text-2xl font-bold ${card.num}`}>{card.value}</p>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <form className="grid grid-cols-1 gap-3 border-b border-slate-200 p-4 sm:grid-cols-[1fr_220px_auto] sm:p-5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input name="q" defaultValue={q} placeholder="Cerca per attività, pratica, cliente o codice fiscale..." className="w-full rounded-md border border-slate-300 py-2.5 pl-10 pr-3 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-sm" />
            </div>
            <select name="filter" defaultValue={filter} className="rounded-md border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-sm">
              <option value="open">Aperte</option>
              <option value="overdue">Scadute</option>
              <option value="today">Oggi</option>
              <option value="week">Prossimi 7 giorni</option>
              <option value="completed">Completate</option>
              <option value="all">Tutte</option>
            </select>
            <button className="inline-flex min-h-11 items-center justify-center rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Filtra</button>
          </form>

          <div className="divide-y divide-slate-100">
            {error ? (
              <div className="p-6 text-center text-sm text-red-600">Errore nel caricamento scadenze: {error.message}</div>
            ) : filteredTasks.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                <CheckCircle2 className="mx-auto mb-3 text-emerald-500" size={30} />
                Nessuna scadenza trovata con questi criteri.
              </div>
            ) : filteredTasks.map(task => (
              <div key={task.id} className="block p-4 hover:bg-slate-50 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {task.is_completed ? <CheckCircle2 className="text-emerald-600" size={18} /> : <Clock className="text-slate-400" size={18} />}
                      <h2 className="break-words text-sm font-semibold text-slate-950">{task.title}</h2>
                    </div>
                    {task.description ? <p className="mt-2 break-words text-sm text-slate-600">{task.description}</p> : null}
                    <p className="mt-2 text-xs text-slate-500">
                      {task.cases?.title || 'Attività generale'}{task.cases?.contacts ? ` · ${task.cases.contacts.last_name} ${task.cases.contacts.first_name}` : ''}
                    </p>
                  </div>
                  <span className={`inline-flex shrink-0 items-center gap-1 self-start rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${dueClass(task)}`}>
                    <CalendarDays size={13} /> {formatDateIt(task.due_date)}
                  </span>
                </div>
                <div className="mt-3">
                  <Link
                    href={task.case_id ? `/cases/${task.case_id}` : `/tasks/${task.id}`}
                    className="inline-flex min-h-8 items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                  >
                    Dettaglio
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-base font-bold text-slate-950">Nuova scadenza rapida</h2>
            <p className="mt-1 text-sm text-slate-500">Per scadenze generali. Dentro una pratica puoi crearla già collegata.</p>
            <div className="mt-4">
              <TaskForm compact />
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}