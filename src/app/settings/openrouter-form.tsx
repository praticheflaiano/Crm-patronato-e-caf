'use client'

import { useActionState } from 'react'
import { updateOpenRouterKey } from './actions'

type State = { ok: boolean; message?: string } | null

const initialState: State = null

async function action(_prev: State, formData: FormData) {
  return updateOpenRouterKey(formData)
}

export function OpenRouterKeyForm({ configured, source }: { configured: boolean; source: 'db' | 'env' | 'none' }) {
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <form action={formAction} className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium text-slate-700">Stato attuale:</span>
        {configured ? (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
            {source === 'db' ? 'Chiave salvata nell’app' : 'Chiave da variabile d’ambiente'}
          </span>
        ) : (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">Non configurata</span>
        )}
      </div>

      <div>
        <label htmlFor="openrouter_api_key" className="block text-sm font-medium text-slate-700">
          Chiave API OpenRouter
        </label>
        <input
          type="password"
          id="openrouter_api_key"
          name="openrouter_api_key"
          autoComplete="off"
          placeholder={configured ? '•••••••• (lascia vuoto per non modificare, oppure incolla una nuova chiave)' : 'sk-or-...'}
          className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        <p className="mt-1.5 text-xs text-slate-500">
          La chiave viene salvata in modo sicuro lato server e non viene mai mostrata di nuovo. La trovi su
          openrouter.ai → Keys. Per rimuoverla, salva il campo vuoto.
        </p>
      </div>

      {state && (
        <div className={`rounded-md p-3 text-sm ${state.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {state.ok ? state.message || 'Salvato.' : state.message || 'Errore.'}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? 'Salvataggio…' : 'Salva chiave'}
      </button>
    </form>
  )
}
