import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { notFound } from 'next/navigation'
import { SetupNotice } from '@/components/setup-notice'
import { hasSupabaseConfig } from '@/utils/supabase/config'
import { createClient } from '@/utils/supabase/server'
import { updateContact } from './actions'

export default async function EditContactPage({ params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabaseConfig()) {
    return <SetupNotice />
  }

  const { id } = await params
  const supabase = await createClient()
  const { data: contactData, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !contactData) {
    notFound()
  }

  const contact = contactData as any /* eslint-disable-line @typescript-eslint/no-explicit-any */

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href={`/contacts/${id}`} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900">
          <ArrowLeft size={16} aria-hidden="true" />
          Indietro
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">Modifica Contatto</h1>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <form action={updateContact} className="space-y-5">
          <input type="hidden" name="id" value={contact.id} />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="first_name" className="block text-sm font-semibold text-slate-700">Nome *</label>
              <input id="first_name" name="first_name" required defaultValue={contact.first_name} className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label htmlFor="last_name" className="block text-sm font-semibold text-slate-700">Cognome *</label>
              <input id="last_name" name="last_name" required defaultValue={contact.last_name} className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            </div>
          </div>

          <div>
            <label htmlFor="fiscal_code" className="block text-sm font-semibold text-slate-700">Codice Fiscale *</label>
            <input id="fiscal_code" name="fiscal_code" required defaultValue={contact.fiscal_code} className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm uppercase shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700">Email</label>
              <input id="email" name="email" type="email" defaultValue={contact.email ?? ''} className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-slate-700">Telefono</label>
              <input id="phone" name="phone" defaultValue={contact.phone ?? ''} className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            </div>
          </div>

          <div>
            <label htmlFor="date_of_birth" className="block text-sm font-semibold text-slate-700">Data di nascita</label>
            <input id="date_of_birth" name="date_of_birth" type="date" defaultValue={contact.date_of_birth ?? ''} className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-semibold text-slate-700">Indirizzo</label>
            <textarea id="address" name="address" rows={3} defaultValue={contact.address ?? ''} className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
            <Link href={`/contacts/${id}`} className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">Annulla</Link>
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
