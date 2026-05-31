'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Upload } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { importContacts } from './actions'

type Result = {
  ok: boolean
  message?: string
  inserted?: number
  skipped?: number
  errors?: string[]
}

export function ImportContactsForm() {
  const router = useRouter()
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<Result | null>(null)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) {
      toast('Seleziona un file CSV.', 'error')
      return
    }
    const formData = new FormData()
    formData.set('file', file)

    startTransition(async () => {
      const res = await importContacts(formData)
      setResult(res)
      toast(res.message ?? (res.ok ? 'Import completato' : 'Import non riuscito'), res.ok ? 'success' : 'error')
      if (res.ok && res.inserted) {
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="csv" className="block text-sm font-semibold text-slate-700">File CSV</label>
          <input
            ref={fileRef}
            id="csv"
            type="file"
            accept=".csv,text/csv"
            required
            disabled={isPending}
            className="mt-2 block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
        >
          <Upload size={16} aria-hidden="true" />
          {isPending ? 'Importazione...' : 'Importa contatti'}
        </button>
      </form>

      {result && (
        <div className={`rounded-lg border p-4 text-sm ${result.ok ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
          <p className={`flex items-center gap-2 font-semibold ${result.ok ? 'text-emerald-800' : 'text-red-800'}`}>
            {result.ok && <CheckCircle2 size={16} aria-hidden="true" />}
            {result.message}
          </p>
          {result.errors && result.errors.length > 0 && (
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-slate-600">
              {result.errors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
