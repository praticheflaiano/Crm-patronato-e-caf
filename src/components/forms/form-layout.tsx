import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

type FormPageHeaderProps = {
  backHref: string
  backLabel?: string
  title: string
  description: string
  children?: ReactNode
}

type FormCardProps = {
  title: string
  description: string
  children: ReactNode
}

export const fieldClassName =
  'mt-2 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

export const labelClassName = 'block text-sm font-semibold text-slate-700'

export const secondaryButtonClassName =
  'inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-100'

export const primaryButtonClassName =
  'inline-flex items-center justify-center gap-2 rounded-md border border-transparent bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100'

export function FormPageHeader({
  backHref,
  backLabel = 'Indietro',
  title,
  description,
  children,
}: FormPageHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900">
          <ArrowLeft size={16} aria-hidden="true" />
          {backLabel}
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {children}
    </div>
  )
}

export function FormCard({ title, description, children }: FormCardProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>
      {children}
    </div>
  )
}
