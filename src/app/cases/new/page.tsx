import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { SetupNotice } from '@/components/setup-notice'
import { hasSupabaseConfig } from '@/utils/supabase/config'
import { createClient } from '@/utils/supabase/server'
import { createCase } from './actions'

export default async function NewCasePage() {
  if (!hasSupabaseConfig()) {
    return <SetupNotice />
  }

  const supabase = await createClient()
  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, fiscal_code')
    .order('last_name', { ascending: true })

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/cases" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900">
          <ArrowLeft size={16} aria-hidden="true" />
          Indietro
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">Nuova Pratica</h1>
        <p className="mt-1 text-sm text-slate-500">Crea una nuova pratica e collegala a un contatto gia presente.</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Dati principali</h2>
          <p className="mt-1 text-xs text-slate-500">I campi contrassegnati con * sono obbligatori.</p>
        </div>

        <form action={createCase} className="space-y-5 p-6">
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-slate-700">
              Titolo Pratica *
            </label>
            <input
              type="text"
              name="title"
              id="title"
              required
              className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="es. ISEE 2026, domanda NASpI, invalidita civile..."
            />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="type" className="block text-sm font-semibold text-slate-700">
                Tipo di Pratica *
              </label>
              <select
                name="type"
                id="type"
                required
                className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="caf">CAF (es. ISEE, 730)</option>
                <option value="patronato">Patronato (es. Pensione, Disoccupazione)</option>
                <option value="invalidita_civile">Invalidita Civile</option>
              </select>
            </div>

            <div>
              <label htmlFor="contact_id" className="block text-sm font-semibold text-slate-700">
                Contatto Associato *
              </label>
              <select
                name="contact_id"
                id="contact_id"
                required
                className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Seleziona un contatto...</option>
                {contacts?.map((contact: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.last_name} {contact.first_name} ({contact.fiscal_code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-slate-700">
              Descrizione / Note iniziali
            </label>
            <textarea
              name="description"
              id="description"
              rows={5}
              className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
            <Link
              href="/cases"
              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Annulla
            </Link>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-transparent bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              <Save size={16} aria-hidden="true" />
              Crea Pratica
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
