'use client'

import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, MessageSquare, Send, Stethoscope, UserPlus, X } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

type Message = { id: string; body: string; author_name: string; created_at: string; is_me: boolean }
type Request = { id: string; title: string; details: string | null; status: string; created_at: string }
type Collaborator = { id: string; user_id: string; role: string; name: string }

const REQUEST_STATUS: Record<string, { label: string; cls: string }> = {
  open: { label: 'Aperta', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  in_progress: { label: 'In corso', cls: 'bg-blue-50 text-blue-700 ring-blue-200' },
  resolved: { label: 'Evasa', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  cancelled: { label: 'Annullata', cls: 'bg-slate-50 text-slate-600 ring-slate-200' },
}

function formatDateTime(value: string) {
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export function CaseCollaboration({ caseId, canInvite }: { caseId: string; canInvite: boolean }) {
  const toast = useToast()
  const [tab, setTab] = useState<'messages' | 'requests'>('messages')

  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [requests, setRequests] = useState<Request[]>([])
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])

  const [reqTitle, setReqTitle] = useState('')
  const [reqDetails, setReqDetails] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const [m, r, c] = await Promise.all([
        fetch(`/api/collaboration/messages?caseId=${caseId}`).then((x) => x.json()),
        fetch(`/api/collaboration/requests?caseId=${caseId}`).then((x) => x.json()),
        fetch(`/api/collaboration/invite?caseId=${caseId}`).then((x) => x.json()),
      ])
      setMessages(Array.isArray(m) ? m : [])
      setRequests(Array.isArray(r) ? r : [])
      setCollaborators(Array.isArray(c) ? c : [])
    } catch {
      /* silent */
    }
  }, [caseId])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load() }, [load])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    const body = newMessage.trim()
    if (!body) return
    setBusy(true)
    const res = await fetch('/api/collaboration/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ caseId, body }),
    })
    setBusy(false)
    if (res.ok) { setNewMessage(''); void load() }
    else toast('Invio messaggio non riuscito', 'error')
  }

  async function createRequest(e: React.FormEvent) {
    e.preventDefault()
    const title = reqTitle.trim()
    if (!title) return
    setBusy(true)
    const res = await fetch('/api/collaboration/requests', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId, title, details: reqDetails.trim() || null }),
    })
    setBusy(false)
    if (res.ok) { setReqTitle(''); setReqDetails(''); void load(); toast('Richiesta inviata', 'success') }
    else toast('Creazione richiesta non riuscita', 'error')
  }

  async function setRequestStatus(id: string, status: string) {
    const res = await fetch('/api/collaboration/requests', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }),
    })
    if (res.ok) void load()
    else toast('Aggiornamento non riuscito', 'error')
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault()
    const email = inviteEmail.trim()
    if (!email) return
    setBusy(true)
    const res = await fetch('/api/collaboration/invite', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ caseId, email }),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    if (res.ok) { setInviteEmail(''); void load(); toast('Medico collegato alla pratica', 'success') }
    else toast(data?.error || 'Collegamento non riuscito', 'error')
  }

  async function removeCollaborator(userId: string) {
    const res = await fetch('/api/collaboration/invite', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ caseId, userId }),
    })
    if (res.ok) void load()
    else toast('Rimozione non riuscita', 'error')
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
          <Stethoscope size={20} aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Collaborazione con il medico</h2>
          <p className="text-sm text-slate-500">Messaggi, richieste e medico collegato alla pratica.</p>
        </div>
      </div>

      {/* Linked doctor / invite */}
      <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase text-slate-500">Medico collegato:</span>
          {collaborators.length === 0 ? (
            <span className="text-sm text-slate-500">nessuno</span>
          ) : (
            collaborators.map((c) => (
              <span key={c.id} className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-700">
                {c.name}
                {canInvite && (
                  <button type="button" onClick={() => removeCollaborator(c.user_id)} className="ml-1 rounded-full hover:bg-purple-200" aria-label="Rimuovi medico">
                    <X size={12} aria-hidden="true" />
                  </button>
                )}
              </span>
            ))
          )}
        </div>
        {canInvite && (
          <form onSubmit={invite} className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email del medico certificatore"
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <button type="submit" disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60">
              <UserPlus size={15} aria-hidden="true" /> Collega
            </button>
          </form>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-3 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
        <button type="button" onClick={() => setTab('messages')} className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold ${tab === 'messages' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'}`}>
          <MessageSquare size={15} aria-hidden="true" /> Messaggi
        </button>
        <button type="button" onClick={() => setTab('requests')} className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold ${tab === 'requests' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'}`}>
          <CheckCircle2 size={15} aria-hidden="true" /> Richieste
        </button>
      </div>

      {tab === 'messages' ? (
        <div>
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">Nessun messaggio. Avvia la conversazione con il medico.</p>
            ) : messages.map((m) => (
              <div key={m.id} className={`flex ${m.is_me ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${m.is_me ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-slate-50 text-slate-900'}`}>
                  <div className={`mb-0.5 text-xs font-semibold ${m.is_me ? 'text-blue-100' : 'text-slate-500'}`}>{m.author_name} · {formatDateTime(m.created_at)}</div>
                  <div className="whitespace-pre-wrap break-words">{m.body}</div>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={sendMessage} className="mt-3 flex gap-2">
            <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Scrivi un messaggio..." className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            <button type="submit" disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              <Send size={15} aria-hidden="true" />
            </button>
          </form>
        </div>
      ) : (
        <div>
          <form onSubmit={createRequest} className="mb-4 space-y-2 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-3">
            <input value={reqTitle} onChange={(e) => setReqTitle(e.target.value)} placeholder="Titolo richiesta (es. Certificato aggiornato)" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            <textarea value={reqDetails} onChange={(e) => setReqDetails(e.target.value)} rows={2} placeholder="Dettagli (opzionale)" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            <button type="submit" disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">Invia richiesta</button>
          </form>
          <div className="space-y-2">
            {requests.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">Nessuna richiesta.</p>
            ) : requests.map((r) => {
              const meta = REQUEST_STATUS[r.status] ?? REQUEST_STATUS.open
              return (
                <div key={r.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{r.title}</p>
                      {r.details && <p className="mt-1 text-sm text-slate-600">{r.details}</p>}
                      <p className="mt-1 text-xs text-slate-400">{formatDateTime(r.created_at)}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${meta.cls}`}>{meta.label}</span>
                  </div>
                  {r.status !== 'resolved' && r.status !== 'cancelled' && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {r.status === 'open' && <button type="button" onClick={() => setRequestStatus(r.id, 'in_progress')} className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">Prendi in carico</button>}
                      <button type="button" onClick={() => setRequestStatus(r.id, 'resolved')} className="rounded-md border border-emerald-300 bg-white px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">Segna evasa</button>
                      <button type="button" onClick={() => setRequestStatus(r.id, 'cancelled')} className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50">Annulla</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
