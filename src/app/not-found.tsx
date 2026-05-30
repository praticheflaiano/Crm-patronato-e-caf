import Link from 'next/link'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <FileQuestion className="mb-4 text-slate-400" size={56} aria-hidden="true" />
      <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Pagina non trovata</h1>
      <p className="mt-3 max-w-sm text-sm leading-6 text-slate-500">
        La risorsa richiesta non esiste o è stata spostata.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
      >
        Torna alla dashboard
      </Link>
    </div>
  )
}
