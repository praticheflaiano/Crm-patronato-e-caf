'use client'

import { useState } from 'react'
import { Plus, Trash2, Lock, Globe } from 'lucide-react'
import { addNote, deleteNote } from '@/app/cases/actions'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CaseNotes({ caseId, notes, currentUserId }: { caseId: string, notes: any[], currentUserId: string }) {
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddNote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.append('case_id', caseId)

    const result = await addNote(formData)

    if (result.error) {
      setError(result.error)
    } else {
      setIsAdding(false)
    }
  }

  const handleDelete = async (noteId: string) => {
    if (confirm('Sei sicuro di voler eliminare questa nota?')) {
      await deleteNote(noteId, caseId)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-slate-900">Note</h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="text-sm text-blue-600 font-medium hover:text-blue-800 flex items-center gap-1"
        >
          <Plus size={16} /> Aggiungi
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddNote} className="mb-6 p-4 border border-slate-100 bg-slate-50 rounded-lg">
          <div className="space-y-4">
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-slate-700">Contenuto *</label>
              <textarea id="content" name="content" rows={3} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_private" name="is_private" value="true" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
              <label htmlFor="is_private" className="text-sm text-slate-700 flex items-center gap-1">
                <Lock size={14} className="text-slate-500" /> Nota privata (visibile solo a te e agli admin)
              </label>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsAdding(false)} className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50">Annulla</button>
              <button type="submit" className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Salva</button>
            </div>
          </div>
        </form>
      )}

      {!notes || notes.length === 0 ? (
        <p className="text-sm text-slate-500">Nessuna nota presente.</p>
      ) : (
        <ul className="space-y-4">
          {notes.map((note) => (
            <li key={note.id} className={`p-4 rounded-lg border ${note.is_private ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-medium text-slate-700">
                    {note.profiles?.full_name || 'Utente sconosciuto'}
                  </span>
                  <span>&bull;</span>
                  <span>{new Date(note.created_at).toLocaleString('it-IT')}</span>
                  {note.is_private ? (
                    <span className="flex items-center gap-1 text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded text-[10px] font-medium" title="Privata">
                      <Lock size={12} /> Privata
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-slate-500" title="Condivisa">
                      <Globe size={12} />
                    </span>
                  )}
                </div>
                {(note.created_by === currentUserId) && (
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                    title="Elimina nota"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <p className="text-sm text-slate-800 whitespace-pre-wrap">{note.content}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
