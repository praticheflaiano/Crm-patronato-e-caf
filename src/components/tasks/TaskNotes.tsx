'use client'

import { FormEvent, useEffect, useState } from 'react'

type TaskNote = {
  id: string
  content: string
}

async function readErrorMessage(response: Response) {
  const payload = await response.json().catch(() => null)
  return typeof payload?.error === 'string' ? payload.error : 'Operazione non riuscita'
}

async function fetchTaskNotes(taskId: string, signal?: AbortSignal) {
  const res = await fetch(`/api/tasks/${taskId}/notes`, { signal })
  if (!res.ok) {
    return { notes: [] as TaskNote[], error: await readErrorMessage(res) }
  }

  const data = await res.json().catch(() => [])
  return { notes: Array.isArray(data) ? (data as TaskNote[]) : [], error: null }
}

export default function TaskNotes({ taskId }: { taskId: string }) {
  const [notes, setNotes] = useState<TaskNote[]>([])
  const [newContent, setNewContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    void fetchTaskNotes(taskId, controller.signal).then((result) => {
      if (controller.signal.aborted) return
      setNotes(result.notes)
      setError(result.error)
    })

    return () => controller.abort()
  }, [taskId])

  const refreshNotes = async () => {
    const result = await fetchTaskNotes(taskId)
    setNotes(result.notes)
    setError(result.error)
  }

  const addNote = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const content = newContent.trim()
    if (!content) return

    setIsSaving(true)
    const res = await fetch(`/api/tasks/${taskId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })

    if (!res.ok) {
      setError(await readErrorMessage(res))
      setIsSaving(false)
      return
    }

    setNewContent('')
    setIsSaving(false)
    await refreshNotes()
  }

  const deleteNote = async (noteId: string) => {
    const res = await fetch(`/api/tasks/${taskId}/notes`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: noteId }),
    })

    if (!res.ok) {
      setError(await readErrorMessage(res))
      return
    }

    await refreshNotes()
  }

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">Note</h2>
      {error ? <p className="mt-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <ul className="divide-y divide-gray-200">
        {notes.map((n) => (
          <li key={n.id} className="py-2 flex justify-between items-start">
            <p>{n.content}</p>
            <button
              className="text-sm text-red-600 hover:underline"
              onClick={() => deleteNote(n.id)}
            >
              Elimina
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={addNote} className="mt-4 flex gap-2">
        <input
          className="flex-1 rounded border px-3 py-2"
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Aggiungi una nota..."
          required
        />
        <button disabled={isSaving} className="rounded bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60">
          {isSaving ? 'Salvo...' : 'Salva'}
        </button>
      </form>
    </section>
  )
}