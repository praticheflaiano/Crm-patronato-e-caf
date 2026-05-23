'use client'

import { useActionState } from 'react'
import { adminLogin } from './actions'

export default function AccessPage() {
  const [state, formAction, isPending] = useActionState(adminLogin, null)

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="bg-white rounded-lg border p-8 text-center max-w-md w-full">
        <h1 className="text-xl font-bold text-slate-950">Accesso diretto CRM</h1>
        <p className="mt-3 text-slate-600 text-sm">
          Inserisci le credenziali admin per accedere.
        </p>

        <form action={formAction} className="mt-6 space-y-4 text-left">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue="praticheflaiano@gmail.com"
              required
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          {state?.error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700 flex items-center gap-2">
              <span className="text-red-500">●</span>
              {state.error}
            </div>
          )}

          {state?.success && (
            <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700 flex items-center gap-2">
              <span className="text-emerald-500">✓</span>
              {state.success}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-md bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? 'Accesso in corso...' : 'Accedi'}
          </button>
        </form>

        <p className="mt-4 text-xs text-slate-400">
          Non hai un account? <a href="/login" className="text-blue-600 hover:underline">Registrati</a>
        </p>
      </div>
    </main>
  )
}