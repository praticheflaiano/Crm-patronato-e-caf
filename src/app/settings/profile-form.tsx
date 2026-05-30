'use client'

import { useState, useTransition } from 'react'
import { useToast } from '@/components/ui/toast'
import { updateProfile } from './actions'

export function ProfileForm({ initialName }: { initialName: string }) {
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(initialName)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateProfile(formData)
      toast(result.message ?? 'Profilo aggiornato', result.ok ? 'success' : 'error')
    })
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-slate-700">
          Nome e cognome
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:max-w-sm"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex min-h-10 items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? 'Salvataggio…' : 'Salva'}
      </button>
    </form>
  )
}
