'use client'

import { useActionState } from 'react'
import { updateOpenRouterKey } from './actions'

type State = { ok: boolean; message?: string } | null

const initialState: State = null

// Suggested free OpenRouter models (id ends in ":free"). The full, always-current
// list is at openrouter.ai/models?max_price=0 — the field accepts any id you paste.
const FREE_MODELS = [
  'deepseek/deepseek-chat-v3-0324:free',
  'deepseek/deepseek-r1-0528:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemini-2.0-flash-exp:free',
  'qwen/qwen-2.5-72b-instruct:free',
  'mistralai/mistral-small-3.2-24b-instruct:free',
]

async function action(_prev: State, formData: FormData) {
  return updateOpenRouterKey(formData)
}

export function OpenRouterKeyForm({
  configured,
  source,
  currentModel,
}: {
  configured: boolean
  source: 'db' | 'env' | 'none'
  currentModel: string
}) {
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <form action={formAction} className="mt-4 space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium text-slate-700">Stato chiave:</span>
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
          placeholder={configured ? '•••••••• (lascia vuoto per non modificare)' : 'sk-or-...'}
          className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        <p className="mt-1.5 text-xs text-slate-500">
          La chiave viene salvata in modo sicuro lato server e non viene mai mostrata di nuovo. La trovi su
          openrouter.ai → Keys.
        </p>
        {configured && source === 'db' && (
          <label className="mt-2 flex items-center gap-2 text-xs text-slate-600">
            <input type="checkbox" name="remove_key" className="rounded border-slate-300" />
            Rimuovi la chiave salvata
          </label>
        )}
      </div>

      <div>
        <label htmlFor="openrouter_model" className="block text-sm font-medium text-slate-700">
          Modello
        </label>
        <input
          type="text"
          id="openrouter_model"
          name="openrouter_model"
          list="openrouter-model-options"
          defaultValue={currentModel}
          autoComplete="off"
          spellCheck={false}
          placeholder="deepseek/deepseek-chat-v3-0324:free"
          className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2.5 font-mono text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        <datalist id="openrouter-model-options">
          {FREE_MODELS.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
        <p className="mt-1.5 text-xs text-slate-500">
          Scegli un modello dall’elenco (sono tutti <strong>gratuiti</strong>, l’id finisce in <code>:free</code>) o incollane
          uno qualsiasi. La lista completa e aggiornata dei modelli gratuiti è su{' '}
          <a
            href="https://openrouter.ai/models?max_price=0"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-blue-600 hover:underline"
          >
            openrouter.ai/models (filtro gratis)
          </a>
          . Lascia vuoto per usare il modello predefinito.
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
        {pending ? 'Salvataggio…' : 'Salva impostazioni AI'}
      </button>
    </form>
  )
}
