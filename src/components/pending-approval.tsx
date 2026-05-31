import { Clock, LogOut, ShieldCheck } from 'lucide-react'
import { logout } from '@/app/login/actions'

type PendingApprovalProps = {
  userLabel: string
  // 'pending' = waiting for first approval, 'disabled' = access was revoked.
  variant?: 'pending' | 'disabled'
}

export function PendingApproval({ userLabel, variant = 'pending' }: PendingApprovalProps) {
  const isDisabled = variant === 'disabled'

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary-soft text-primary">
          {isDisabled ? <ShieldCheck size={26} aria-hidden="true" /> : <Clock size={26} aria-hidden="true" />}
        </div>
        <h1 className="mt-5 text-center text-xl font-bold text-slate-950">
          {isDisabled ? 'Accesso sospeso' : 'Account in attesa di approvazione'}
        </h1>
        <p className="mt-3 text-center text-sm leading-relaxed text-slate-600">
          {isDisabled ? (
            <>
              Il tuo accesso al CRM è stato sospeso da un amministratore. Contatta
              l&apos;amministrazione per maggiori informazioni.
            </>
          ) : (
            <>
              La tua registrazione è stata ricevuta. Un amministratore deve approvare
              l&apos;account prima che tu possa accedere ai dati del CRM. Riceverai
              accesso non appena sarai abilitato.
            </>
          )}
        </p>
        <div className="mt-6 rounded-lg bg-slate-50 p-3 text-center">
          <p className="text-xs font-medium text-slate-500">Accesso effettuato come</p>
          <p className="mt-0.5 truncate text-sm font-semibold text-slate-800" title={userLabel}>
            {userLabel}
          </p>
        </div>
        <form action={logout} className="mt-6">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <LogOut size={16} aria-hidden="true" />
            Esci
          </button>
        </form>
      </div>
    </div>
  )
}
