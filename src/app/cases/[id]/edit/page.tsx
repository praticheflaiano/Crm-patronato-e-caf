import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { notFound } from 'next/navigation'
import { SetupNotice } from '@/components/setup-notice'
import { hasSupabaseConfig } from '@/utils/supabase/config'
import { createClient } from '@/utils/supabase/server'
import { updateCase } from './actions'

export default async function EditCasePage({ params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabaseConfig()) {
    return <SetupNotice />
  }

  const { id } = await params
  const supabase = await createClient()
  const [{ data: caseItemData, error }, { data: contacts }] = await Promise.all([
    supabase.from('cases').select('*').eq('id', id).single(),
    supabase.from('contacts').select('id, first_name, last_name, fiscal_code').order('last_name', { ascending: true }),
  ])

  if (error || !caseItemData) {
    notFound()
  }

  const caseItem = caseItemData as any /* eslint-disable-line @typescript-eslint/no-explicit-any */

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href={`/cases/${id}`} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900">
          <ArrowLeft size={16} aria-hidden="true" />
          Indietro
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">Modifica Pratica</h1>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <form action={updateCase} className="space-y-5">
          <input type="hidden" name="id" value={caseItem.id} />

          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-slate-700">Titolo *</label>
            <input id="title" name="title" required defaultValue={caseItem.title} className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="type" className="block text-sm font-semibold text-slate-700">Tipo *</label>
              <select id="type" name="type" required defaultValue={caseItem.type} className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                <option value="caf">CAF</option>
                <option value="patronato">Patronato</option>
                <option value="invalidita_civile">Invalidita Civile</option>
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-semibold text-slate-700">Stato *</label>
              <select id="status" name="status" required defaultValue={caseItem.status ?? 'open'} className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                <option value="open">Aperta</option>
                <option value="in_progress">In lavorazione</option>
                <option value="pending_documents">Documenti mancanti</option>
                <option value="completed">Completata</option>
                <option value="rejected">Respinta</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="contact_id" className="block text-sm font-semibold text-slate-700">Contatto *</label>
            <select id="contact_id" name="contact_id" required defaultValue={caseItem.contact_id ?? ''} className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
              <option value="">Seleziona un contatto...</option>
              {contacts?.map((contact: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => (
                <option key={contact.id} value={contact.id}>
                  {contact.last_name} {contact.first_name} ({contact.fiscal_code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-slate-700">Descrizione</label>
            <textarea id="description" name="description" rows={5} defaultValue={caseItem.description ?? ''} className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
            <Link href={`/cases/${id}`} className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">Annulla</Link>
            <button type="submit" className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
              <Save size={16} aria-hidden="true" />
              Salva
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
