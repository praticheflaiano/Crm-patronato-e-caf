'use client'

import { useEffect, useRef, useState } from 'react'
import { FileText, Loader2, Trash2, Upload, Type, CheckCircle2, AlertCircle } from 'lucide-react'

type KnowledgeDoc = {
  id: string
  title: string
  source_type: 'file' | 'text'
  status: 'pending' | 'processing' | 'ready' | 'error'
  error_message: string | null
  chunk_count: number
  byte_size: number | null
  created_at: string
}

function StatusBadge({ doc }: { doc: KnowledgeDoc }) {
  if (doc.status === 'ready') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
        <CheckCircle2 size={12} /> Indicizzato ({doc.chunk_count})
      </span>
    )
  }
  if (doc.status === 'error') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700" title={doc.error_message ?? ''}>
        <AlertCircle size={12} /> Errore
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
      <Loader2 size={12} className="animate-spin" /> In elaborazione
    </span>
  )
}

export function KnowledgeManager() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [pasteTitle, setPasteTitle] = useState('')
  const [pasteText, setPasteText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function fetchDocs(): Promise<KnowledgeDoc[]> {
    try {
      const res = await fetch('/api/knowledge', { cache: 'no-store' })
      const data = await res.json()
      return Array.isArray(data) ? data : []
    } catch {
      return []
    }
  }

  async function refresh() {
    setDocs(await fetchDocs())
  }

  useEffect(() => {
    let active = true
    fetchDocs().then((data) => {
      if (!active) return
      setDocs(data)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setMessage(null)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('title', file.name)
      const res = await fetch('/api/knowledge', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Caricamento non riuscito.')
      setMessage({ ok: true, text: `"${file.name}" indicizzato (${data.chunks} frammenti).` })
      await refresh()
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : 'Errore.' })
    } finally {
      setBusy(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handlePaste(e: React.FormEvent) {
    e.preventDefault()
    if (!pasteTitle.trim() || !pasteText.trim()) return
    setBusy(true)
    setMessage(null)
    try {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: pasteTitle, text: pasteText }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Salvataggio non riuscito.')
      setMessage({ ok: true, text: `"${pasteTitle}" indicizzato (${data.chunks} frammenti).` })
      setPasteTitle('')
      setPasteText('')
      await refresh()
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : 'Errore.' })
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Eliminare "${title}" dalla conoscenza?`)) return
    try {
      const res = await fetch(`/api/knowledge?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (res.ok) setDocs((prev) => prev.filter((d) => d.id !== id))
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`rounded-lg border p-3 text-sm ${message.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Upload file */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-950">
            <Upload size={18} aria-hidden="true" /> Carica un file
          </h2>
          <p className="mt-1 text-sm text-slate-500">PDF, Word (.docx) o testo (.txt). Max 10 MB.</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,.md,.csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            onChange={handleFileUpload}
            disabled={busy}
            className="mt-4 block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-primary/90 disabled:opacity-50"
          />
          {busy && (
            <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
              <Loader2 size={14} className="animate-spin" /> Elaborazione e indicizzazione in corso…
            </p>
          )}
        </section>

        {/* Paste text */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-950">
            <Type size={18} aria-hidden="true" /> Incolla testo
          </h2>
          <form onSubmit={handlePaste} className="mt-4 space-y-3">
            <input
              type="text"
              value={pasteTitle}
              onChange={(e) => setPasteTitle(e.target.value)}
              placeholder="Titolo (es. Procedura ISEE 2026)"
              className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={4}
              placeholder="Incolla qui il testo da aggiungere alla conoscenza…"
              className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="submit"
              disabled={busy || !pasteTitle.trim() || !pasteText.trim()}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
            >
              Aggiungi alla conoscenza
            </button>
          </form>
        </section>
      </div>

      {/* Document list */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">Documenti nella conoscenza</h2>
        {loading ? (
          <p className="mt-4 flex items-center gap-2 text-sm text-slate-500"><Loader2 size={14} className="animate-spin" /> Caricamento…</p>
        ) : docs.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Nessun documento ancora. Carica un file o incolla del testo per iniziare.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {docs.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText size={18} className="shrink-0 text-slate-400" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{doc.title}</p>
                    <div className="mt-0.5"><StatusBadge doc={doc} /></div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(doc.id, doc.title)}
                  className="shrink-0 rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  aria-label={`Elimina ${doc.title}`}
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
