import Link from 'next/link'
import { ArrowLeft, Edit, FolderKanban, Mail, Phone, UserRound } from 'lucide-react'
import { notFound } from 'next/navigation'
import { SetupNotice } from '@/components/setup-notice'
import { hasSupabaseConfig } from '@/utils/supabase/config'
import { createClient } from '@/utils/supabase/server'

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabaseConfig()) {
    return <SetupNotice />
  }

  const { id } = await params
  const supabase = await createClient()
  const { data: contact, error } = await supabase
    .from('contacts')
    .select('*, cases(id, title, status, type, created_at)')
    .eq('id', id)
    .single()

  if (error || !contact) {
    notFound()
  }

  const contactItem = contact as any /* eslint-disable-line @typescript-eslint/no-explicit-any */

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Link href="/contacts" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900">
            <ArrowLeft size={16} aria-hidden="true" />
            Indietro ai contatti
          </Link>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
            {contactItem.last_name} {contactItem.first_name}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{contactItem.fiscal_code}</p>
        </div>
        <Link href={`/contacts/${contactItem.id}/edit`} className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
          <Edit size={16} aria-hidden="true" />
          Modifica
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-950">Anagrafica</h2>
          <div className="mt-5 space-y-4 text-sm">
            <div className="flex gap-3">
              <UserRound className="mt-0.5 text-slate-400" size={18} aria-hidden="true" />
              <div>
                <p className="font-semibold text-slate-700">Nominativo</p>
                <p className="text-slate-600">{contactItem.last_name} {contactItem.first_name}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Mail className="mt-0.5 text-slate-400" size={18} aria-hidden="true" />
              <div>
                <p className="font-semibold text-slate-700">Email</p>
                <p className="text-slate-600">{contactItem.email || '-'}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Phone className="mt-0.5 text-slate-400" size={18} aria-hidden="true" />
              <div>
                <p className="font-semibold text-slate-700">Telefono</p>
                <p className="text-slate-600">{contactItem.phone || '-'}</p>
              </div>
            </div>
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
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {contactItem.cases.map((caseItem: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => (
                <Link key={caseItem.id} href={`/cases/${caseItem.id}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{caseItem.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{caseItem.type.replace('_', ' ')}</p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                    {caseItem.status.replace('_', ' ')}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
