'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'

type Props = {
  caseId?: string | null
  onCreated?: () => void
  compact?: boolean
}

export default function TaskForm({ caseId, onCreated, compact = false }: Props) {
  const [formData, setFormData] = useState({ title: '', description: '', due_date: '', case_id: caseId ?? '' })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        throw new Error(payload.error || 'Errore nella creazione della scadenza')
      }
      setFormData({ title: '', description: '', due_date: '', case_id: caseId ?? '' })
      onCreated?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nella creazione della scadenza')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? 'space-y-3' : 'space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm'}>
      {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <div>
        <label htmlFor="task-title" className="block text-sm font-semibold text-slate-700">Cosa devi fare?</label>
        <input
          id="task-title"
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          placeholder="es. Chiamare il cittadino per documento mancante"
          className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-base shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-sm"
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="task-due-date" className="block text-sm font-semibold text-slate-700">Scadenza</label>
          <input
            id="task-due-date"
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-base shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-sm"
          />
        </div>
        {!caseId ? (
          <div>
            <label htmlFor="task-case-id" className="block text-sm font-semibold text-slate-700">ID pratica</label>
            <input
              id="task-case-id"
              type="text"
              value={formData.case_id}
              onChange={(e) => setFormData({ ...formData, case_id: e.target.value })}
              placeholder="Opzionale"
              className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-base shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-sm"
            />
          </div>
        ) : null}
      </div>
      <div>
        <label htmlFor="task-description" className="block text-sm font-semibold text-slate-700">Note operative</label>
        <textarea
          id="task-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={compact ? 2 : 3}
          placeholder="Documenti richiesti, esito telefonata o prossima azione."
          className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-base shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={isSaving}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 sm:w-auto"
      >
        <Plus size={16} aria-hidden="true" />
        {isSaving ? 'Salvataggio...' : 'Aggiungi scadenza'}
      </button>
    </form>
  )
}
