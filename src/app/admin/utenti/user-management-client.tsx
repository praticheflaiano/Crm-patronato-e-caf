'use client'

import { useState, useTransition } from 'react'
import { Check, ShieldX, RotateCcw, UserCog } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { setMemberAccess } from './actions'

// Defined locally so this client bundle never imports the server-only
// `@/lib/user-profile` module (which pulls in the Supabase server client).
type Role = 'admin' | 'operator' | 'collaborator' | 'doctor'
type MemberStatus = 'pending' | 'active' | 'disabled'

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  operator: 'Operatore',
  collaborator: 'Collaboratore',
  doctor: 'Medico',
}

function formatRole(role: Role) {
  return ROLE_LABELS[role]
}

export type ManagedMember = {
  id: string
  full_name: string | null
  role: Role
  status: MemberStatus
}

const ROLE_OPTIONS: Role[] = ['operator', 'collaborator', 'doctor', 'admin']

function submit(role: Role, status: MemberStatus, targetId: string) {
  const fd = new FormData()
  fd.set('targetId', targetId)
  fd.set('role', role)
  fd.set('status', status)
  return setMemberAccess(fd)
}

function MemberRow({ member, isSelf }: { member: ManagedMember; isSelf: boolean }) {
  const toast = useToast()
  const [role, setRole] = useState<Role>(member.role === 'admin' ? 'admin' : member.role)
  const [pending, startTransition] = useTransition()

  const run = (status: MemberStatus, successMsg: string) => {
    startTransition(async () => {
      const result = await submit(role, status, member.id)
      if (result.ok) {
        toast(successMsg, 'success')
      } else {
        toast(result.error, 'error')
      }
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900" title={member.full_name ?? undefined}>
          {member.full_name || 'Utente senza nome'}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          Ruolo attuale: {formatRole(member.role)}
          {isSelf && ' · sei tu'}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor={`role-${member.id}`}>
          Ruolo
        </label>
        <select
          id={`role-${member.id}`}
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          disabled={pending || isSelf}
          className="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-800 disabled:opacity-50"
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {formatRole(r)}
            </option>
          ))}
        </select>

        {member.status === 'pending' && (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => run('active', 'Utente approvato.')}
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              <Check size={15} aria-hidden="true" /> Approva
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => run('disabled', 'Registrazione rifiutata.')}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <ShieldX size={15} aria-hidden="true" /> Rifiuta
            </button>
          </>
        )}

        {member.status === 'active' && !isSelf && (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => run('active', 'Ruolo aggiornato.')}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              <UserCog size={15} aria-hidden="true" /> Salva ruolo
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => run('disabled', 'Accesso sospeso.')}
              className="inline-flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
              <ShieldX size={15} aria-hidden="true" /> Sospendi
            </button>
          </>
        )}

        {member.status === 'disabled' && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run('active', 'Accesso riattivato.')}
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            <RotateCcw size={15} aria-hidden="true" /> Riattiva
          </button>
        )}
      </div>
    </div>
  )
}

function Section({
  title,
  description,
  members,
  currentUserId,
  emptyLabel,
}: {
  title: string
  description: string
  members: ManagedMember[]
  currentUserId: string
  emptyLabel: string
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">
          {title} <span className="text-slate-400">({members.length})</span>
        </h2>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      {members.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">{emptyLabel}</p>
      ) : (
        <div className="space-y-2">
          {members.map((m) => (
            <MemberRow key={m.id} member={m} isSelf={m.id === currentUserId} />
          ))}
        </div>
      )}
    </section>
  )
}

export function UserManagementClient({
  members,
  currentUserId,
}: {
  members: ManagedMember[]
  currentUserId: string
}) {
  const pending = members.filter((m) => m.status === 'pending')
  const active = members.filter((m) => m.status === 'active')
  const disabled = members.filter((m) => m.status === 'disabled')

  return (
    <div className="space-y-8">
      <Section
        title="In attesa di approvazione"
        description="Nuove registrazioni. Assegna un ruolo e approva per concedere l'accesso."
        members={pending}
        currentUserId={currentUserId}
        emptyLabel="Nessuna registrazione in attesa."
      />
      <Section
        title="Membri attivi"
        description="Utenti con accesso al CRM. Puoi cambiare ruolo o sospendere l'accesso."
        members={active}
        currentUserId={currentUserId}
        emptyLabel="Nessun membro attivo."
      />
      <Section
        title="Accessi sospesi"
        description="Utenti senza accesso. Puoi riattivarli quando necessario."
        members={disabled}
        currentUserId={currentUserId}
        emptyLabel="Nessun accesso sospeso."
      />
    </div>
  )
}
