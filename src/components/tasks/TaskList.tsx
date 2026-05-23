'use client'

import { useEffect, useState } from 'react'
import TaskItem from './TaskItem'

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
  caseId?: string
  refreshKey?: number
}

function normalizeTasks(value: unknown): Task[] {
  return Array.isArray(value) ? value.filter((item): item is Task => Boolean(item && typeof item === 'object' && 'title' in item)) : []
}

export default function TaskList({ caseId, refreshKey = 0 }: Props) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = async () => {
    setLoading(true)
    setError(null)
    try {
      const url = caseId ? `/api/tasks?case_id=${encodeURIComponent(caseId)}` : '/api/tasks?completed=false'
      const res = await fetch(url, { cache: 'no-store' })
      const data = await res.json().catch(() => [])
      if (!res.ok) throw new Error(data.error || 'Errore nel caricamento scadenze')
      setTasks(normalizeTasks(data))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento scadenze')
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchTasks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, refreshKey])

  async function toggleTask(task: Task) {
    if (!task.id) return
    const nextCompleted = !task.is_completed
    setTasks(prev => prev.map(item => item.id === task.id ? { ...item, is_completed: nextCompleted } : item))
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_completed: nextCompleted }),
    })
    if (!res.ok) fetchTasks()
  }

  async function deleteTask(task: Task) {
    if (!task.id) return
    setTasks(prev => prev.filter(item => item.id !== task.id))
    const res = await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' })
    if (!res.ok) fetchTasks()
  }

  if (loading) return <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">Caricamento scadenze...</div>
  if (error) return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>

  return (
    <div className="space-y-3">
      {tasks.length > 0 ? (
        tasks.map((task) => <TaskItem key={task.id ?? task.title} task={task} onToggle={toggleTask} onDelete={deleteTask} />)
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-5 text-center text-sm text-slate-500">
          Nessuna scadenza aperta. Aggiungi un promemoria per non perdere solleciti o appuntamenti.
        </div>
      )}
    </div>
  )
}
