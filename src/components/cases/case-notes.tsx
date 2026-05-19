'use client'

import { useState, useTransition } from 'react'
import { createNote } from '@/app/cases/[id]/notes/actions'

interface Profile {
  first_name: string | null
  last_name: string | null
}

interface Note {
  id: string
  content: string
  created_at: string | null
  author_id: string | null
  profiles?: Profile
}

interface CaseNotesProps {
  caseId: string
  notes: Note[]
}

export function CaseNotes({ caseId, notes }: CaseNotesProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newNoteContent, setNewNoteContent] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNoteContent.trim()) return

    startTransition(async () => {
      const result = await createNote(caseId, newNoteContent.trim())
      if (result.success) {
        setNewNoteContent('')
        setIsAdding(false)
      } else {
        alert(result.error || 'Errore nella creazione della nota')
      }
    })
  }

  // Use a copy to sort notes by descending creation date
  const sortedNotes = [...notes].sort((a, b) => {
    if (!a.created_at || !b.created_at) return 0
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Note e Appunti</h2>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="text-sm text-blue-600 font-medium hover:text-blue-800"
          >
            + Aggiungi Nota
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleAddNote} className="mb-6 space-y-3">
          <textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="Scrivi una nota..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm min-h-[100px]"
            autoFocus
            disabled={isPending}
          />
          <div className="flex justify-end gap-2">
             <button
              type="button"
              onClick={() => setIsAdding(false)}
              disabled={isPending}
              className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-200 disabled:opacity-50"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isPending || !newNoteContent.trim()}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              Salva Nota
            </button>
          </div>
        </form>
      )}

      {!notes || notes.length === 0 ? (
        <p className="text-sm text-gray-500">Nessuna nota per questa pratica.</p>
      ) : (
        <ul className="space-y-4">
          {sortedNotes.map((note) => {
             const authorName = note.profiles
               ? `${note.profiles.first_name || ''} ${note.profiles.last_name || ''}`.trim()
               : 'Utente sconosciuto'
             const date = note.created_at ? new Date(note.created_at).toLocaleString('it-IT', {
               day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
             }) : ''

             return (
              <li key={note.id} className="text-sm bg-gray-50 rounded-md p-3 border border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-700">{authorName}</span>
                  <span className="text-xs text-gray-400">{date}</span>
                </div>
                <p className="text-gray-800 whitespace-pre-wrap">{note.content}</p>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
