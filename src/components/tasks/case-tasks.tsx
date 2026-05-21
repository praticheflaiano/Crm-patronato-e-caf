'use client'

import { FormEvent, useRef, useState, useTransition } from 'react'
import { Check, Plus } from 'lucide-react'
import { createTask, toggleTask } from '@/app/cases/[id]/tasks/actions'

type Task = {
  id: string
  title: string
  is_completed: boolean | null
  due_date: string | null
}

type CaseTasksProps = {
  caseId: string
  tasks: Task[]
}

export function CaseTasks({ caseId, tasks }: CaseTasksProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [isAdding, setIsAdding] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [optimisticTasks, setOptimisticTasks] = useState(tasks)

  // Update internal state when props change
  if (tasks !== optimisticTasks && !isPending) {
    setOptimisticTasks(tasks)
  }

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)

    const formData = new FormData(event.currentTarget)
    const title = formData.get('title') as string

    if (!title.trim()) {
      return
    }

    startTransition(async () => {
      const result = await createTask(formData)

      if (!result.ok) {
        setMessage(result.message ?? 'Errore salvataggio task.')
        return
      }

      formRef.current?.reset()
      setIsAdding(false)
    })
  }

  function handleToggle(task: Task) {
    const newStatus = !task.is_completed

    // Optimistic update
    setOptimisticTasks(prev =>
      prev.map(t => t.id === task.id ? { ...t, is_completed: newStatus } : t)
    )

    startTransition(async () => {
      const result = await toggleTask(task.id, caseId, newStatus)
      if (!result.ok) {
        // Revert on error
        setOptimisticTasks(tasks)
      }
    })
  }

  // Sort tasks: pending first, then completed. Then by ID as fallback.
  const sortedTasks = [...optimisticTasks].sort((a, b) => {
    if (a.is_completed === b.is_completed) return a.id.localeCompare(b.id)
    return a.is_completed ? 1 : -1
  })

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Task</h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="text-sm text-blue-600 font-medium hover:text-blue-800 flex items-center gap-1"
        >
          <Plus size={16} /> Aggiungi
        </button>
      </div>

      {message ? <p className="mb-4 text-sm text-red-600">{message}</p> : null}

      {isAdding && (
        <form ref={formRef} onSubmit={handleAdd} className="mb-4 flex gap-2">
          <input type="hidden" name="caseId" value={caseId} />
          <input
            type="text"
            name="title"
            placeholder="Nuovo task..."
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
            autoFocus
          />
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
          >
            Salva
          </button>
        </form>
      )}

      {sortedTasks.length === 0 && !isAdding ? (
        <p className="text-sm text-gray-500">Nessun task per questa pratica.</p>
      ) : (
        <ul className="space-y-3">
          {sortedTasks.map((task) => (
            <li key={task.id} className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => handleToggle(task)}
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                  task.is_completed
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
              >
                {task.is_completed && <Check size={14} strokeWidth={3} />}
              </button>
              <span className={`text-sm ${task.is_completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                {task.title}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
