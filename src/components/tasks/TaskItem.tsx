'use client'

import Link from 'next/link'
import { CalendarDays, CheckCircle2, Circle, Trash2 } from 'lucide-react'
import { formatDateIt, isPastDate, isTodayDate } from '@/lib/date-utils'

type Task = {
  id?: string
  title: string
  description?: string | null
  due_date?: string | null
  is_completed?: boolean | null
  case_id?: string | null
  cases?: {
    id: string
    title: string
    contacts?: { first_name: string; last_name: string; fiscal_code?: string | null } | null
  } | null
}

type Props = {
  task: Task
  onToggle?: (task: Task) => void
  onDelete?: (task: Task) => void
}

function dueDateClass(task: Task) {
  if (task.is_completed) return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
  if (isPastDate(task.due_date)) return 'bg-red-50 text-red-700 ring-red-200'
  if (isTodayDate(task.due_date)) return 'bg-amber-50 text-amber-700 ring-amber-200'
  return 'bg-slate-50 text-slate-600 ring-slate-200'
}

export default function TaskItem({ task, onToggle, onDelete }: Props) {
  const isCompleted = Boolean(task.is_completed)
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        {onToggle ? (
          <button
            type="button"
            onClick={() => onToggle(task)}
            className={`mt-0.5 shrink-0 rounded-full ${isCompleted ? 'text-emerald-600' : 'text-slate-400 hover:text-blue-600'}`}
            aria-label={isCompleted ? 'Riapri attività' : 'Segna completata'}
          >
            {isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
          </button>
        ) : (
          <span className={`mt-0.5 shrink-0 ${isCompleted ? 'text-emerald-600' : 'text-slate-400'}`}>
            {isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <h3 className={`break-words text-sm font-semibold ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-950'}`}>
              {task.title}
            </h3>
            <span className={`inline-flex shrink-0 items-center gap-1 self-start rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${dueDateClass(task)}`}>
              <CalendarDays size={13} aria-hidden="true" />
              {formatDateIt(task.due_date)}
            </span>
          </div>
          {task.description ? (
            <p className="mt-2 break-words text-sm text-slate-600">{task.description}</p>
          ) : null}
          {task.cases ? (
            <Link href={`/cases/${task.cases.id}`} className="mt-3 inline-flex text-xs font-semibold text-blue-700 hover:text-blue-900">
              {task.cases.title}
              {task.cases.contacts ? ` · ${task.cases.contacts.last_name} ${task.cases.contacts.first_name}` : ''}
            </Link>
          ) : null}
        </div>
        {onDelete && task.id ? (
          <button
            type="button"
            onClick={() => onDelete(task)}
            className="shrink-0 rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
            aria-label="Elimina scadenza"
          >
            <Trash2 size={16} />
          </button>
        ) : null}
      </div>
    </div>
  )
}
