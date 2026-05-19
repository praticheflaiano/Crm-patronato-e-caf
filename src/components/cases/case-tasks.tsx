'use client'

import { useState, useTransition } from 'react'
import { createTask, toggleTask } from '@/app/cases/[id]/tasks/actions'

interface Task {
  id: string
  title: string
  is_completed: boolean | null
}

interface CaseTasksProps {
  caseId: string
  tasks: Task[]
}

export function CaseTasks({ caseId, tasks }: CaseTasksProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    startTransition(async () => {
      const result = await createTask(caseId, newTaskTitle.trim())
      if (result.success) {
        setNewTaskTitle('')
        setIsAdding(false)
      } else {
        alert(result.error || 'Errore nella creazione del task')
      }
    })
  }

  const handleToggleTask = (taskId: string, currentCompleted: boolean | null) => {
    startTransition(async () => {
      const result = await toggleTask(taskId, !currentCompleted, caseId)
      if (result?.error) {
        alert(result.error)
      }
    })
  }

  // Use a copy to sort correctly instead of mutating array
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.is_completed === b.is_completed) return 0
    return a.is_completed ? 1 : -1
  })

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Task</h2>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="text-sm text-blue-600 font-medium hover:text-blue-800"
          >
            + Aggiungi
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleAddTask} className="mb-4 flex gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Nuovo task..."
            className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            autoFocus
            disabled={isPending}
          />
          <button
            type="submit"
            disabled={isPending || !newTaskTitle.trim()}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
          >
            Salva
          </button>
          <button
            type="button"
            onClick={() => setIsAdding(false)}
            disabled={isPending}
            className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-200 disabled:opacity-50"
          >
            Annulla
          </button>
        </form>
      )}

      {!tasks || tasks.length === 0 ? (
        <p className="text-sm text-gray-500">Nessun task per questa pratica.</p>
      ) : (
        <ul className="space-y-2">
          {sortedTasks.map((task) => (
            <li key={task.id} className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={task.is_completed || false}
                onChange={() => handleToggleTask(task.id, task.is_completed)}
                disabled={isPending}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-600"
              />
              <span className={task.is_completed ? 'line-through text-gray-400' : 'text-gray-900'}>
                {task.title}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
