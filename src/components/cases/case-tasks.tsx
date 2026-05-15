'use client'

import { useState } from 'react'
import { Plus, Trash2, CheckCircle2, Circle } from 'lucide-react'
import { addTask, toggleTaskCompletion, deleteTask } from '@/app/cases/actions'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CaseTasks({ caseId, tasks }: { caseId: string, tasks: any[] }) {
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.append('case_id', caseId)

    const result = await addTask(formData)

    if (result.error) {
      setError(result.error)
    } else {
      setIsAdding(false)
    }
  }

  const handleToggle = async (taskId: string, currentStatus: boolean) => {
    await toggleTaskCompletion(taskId, caseId, !currentStatus)
  }

  const handleDelete = async (taskId: string) => {
    if (confirm('Sei sicuro di voler eliminare questo task?')) {
      await deleteTask(taskId, caseId)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-slate-900">Task</h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="text-sm text-blue-600 font-medium hover:text-blue-800 flex items-center gap-1"
        >
          <Plus size={16} /> Aggiungi
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddTask} className="mb-6 p-4 border border-slate-100 bg-slate-50 rounded-lg">
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700">Titolo *</label>
              <input type="text" id="title" name="title" required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border" />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700">Descrizione</label>
              <textarea id="description" name="description" rows={2} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border" />
            </div>
            <div>
              <label htmlFor="due_date" className="block text-sm font-medium text-slate-700">Scadenza</label>
              <input type="datetime-local" id="due_date" name="due_date" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsAdding(false)} className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50">Annulla</button>
              <button type="submit" className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Salva</button>
            </div>
          </div>
        </form>
      )}

      {!tasks || tasks.length === 0 ? (
        <p className="text-sm text-slate-500">Nessun task per questa pratica.</p>
      ) : (
        <ul className="space-y-3">
          {tasks.map((task) => (
            <li key={task.id} className="group flex items-start justify-between gap-2 p-3 rounded-md hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors">
              <div className="flex items-start gap-3">
                <button
                  onClick={() => handleToggle(task.id, task.is_completed)}
                  className={`mt-0.5 ${task.is_completed ? 'text-green-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {task.is_completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                </button>
                <div>
                  <p className={`text-sm font-medium ${task.is_completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>{task.title}</p>
                  {task.description && <p className={`text-xs mt-1 ${task.is_completed ? 'text-slate-400' : 'text-slate-500'}`}>{task.description}</p>}
                  {task.due_date && (
                    <p className={`text-xs mt-1.5 font-medium ${task.is_completed ? 'text-slate-400' : (new Date(task.due_date) < new Date() ? 'text-red-600' : 'text-blue-600')}`}>
                      Scadenza: {new Date(task.due_date).toLocaleString('it-IT')}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(task.id)}
                className="text-slate-400 hover:text-red-600 p-1 rounded-md opacity-0 hover:bg-red-50 group-hover:opacity-100 transition-all"
                title="Elimina task"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
