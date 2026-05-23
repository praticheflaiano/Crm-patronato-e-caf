import Link from 'next/link'
import { ArrowLeft, Edit, FolderKanban, Mail, Phone, Plus, UserRound } from 'lucide-react'
import { notFound } from 'next/navigation'
import { SetupNotice } from '@/components/setup-notice'
import { getCaseStatusMeta, getCaseTypeLabel } from '@/lib/case-workflow'
import { hasSupabaseConfig } from '@/utils/supabase/config'
import { createClient } from '@/utils/supabase/server'

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabaseConfig()) return <SetupNotice />

  const { id } = await params
  const supabase = await createClient()
  const { data: contact, error } = await supabase
    .from('contacts')
    .select('*, cases(id, title, status, type, created_at)')
    .eq('id', id)
    .single()

  if (error || !contact) notFound()

  const contactItem = contact as any /* eslint-disable-line @typescript-eslint/no-explicit-any */

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Link href="/contacts" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900">
            <ArrowLeft size={16} aria-hidden="true" />
            Indietro ai contatti
          </Link>
          <h1 className="mt-3 break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{contactItem.last_name} {contactItem.first_name}</h1>
          <p className="mt-1 break-words text-sm text-slate-500">{contactItem.fiscal_code}</p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Link href={`/cases/new?contactId=${contactItem.id}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
            <Plus size={16} aria-hidden="true" /> Nuova pratica
          </Link>
          <Link href={`/contacts/${contactItem.id}/edit`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
            <Edit size={16} aria-hidden="true" /> Modifica
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-sm font-semibold text-slate-950">Anagrafica</h2>
          <div className="mt-5 space-y-4 text-sm">
            <div className="flex gap-3"><UserRound className="mt-0.5 shrink-0 text-slate-400" size={18} /><div className="min-w-0"><p className="font-semibold text-slate-700">Nominativo</p><p className="break-words text-slate-600">{contactItem.last_name} {contactItem.first_name}</p></div></div>
            <div className="flex gap-3"><Mail className="mt-0.5 shrink-0 text-slate-400" size={18} /><div className="min-w-0"><p className="font-semibold text-slate-700">Email</p><p className="break-all text-slate-600">{contactItem.email || '-'}</p></div></div>
            <div className="flex gap-3"><Phone className="mt-0.5 shrink-0 text-slate-400" size={18} /><div className="min-w-0"><p className="font-semibold text-slate-700">Telefono</p><p className="text-slate-600">{contactItem.phone || '-'}</p></div></div>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-2">
            {contactItem.phone ? <a href={`tel:${contactItem.phone}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"><Phone size={16} /> Chiama</a> : null}
            {contactItem.email ? <a href={`mailto:${contactItem.email}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100"><Mail size={16} /> Invia email</a> : null}
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-950">Pratiche collegate</h2>
          </div>
          {!contactItem.cases || contactItem.cases.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <FolderKanban className="mx-auto text-slate-300" size={24} aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-slate-700">Nessuna pratica collegata</p>
              <Link href={`/cases/new?contactId=${contactItem.id}`} className="mt-4 inline-flex min-h-10 items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Crea prima pratica</Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {contactItem.cases.map((caseItem: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                const statusMeta = getCaseStatusMeta(caseItem.status)
                return (
                  <Link key={caseItem.id} href={`/cases/${caseItem.id}`} className="flex flex-col items-start gap-2 px-5 py-4 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-semibold text-slate-950">{caseItem.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{getCaseTypeLabel(caseItem.type)}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusMeta.badgeClassName}`}>{statusMeta.label}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
