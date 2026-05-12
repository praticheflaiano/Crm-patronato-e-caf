import Link from 'next/link'
import { SetupNotice } from '@/components/setup-notice'
import { hasSupabaseConfig } from '@/utils/supabase/config'
import { createClient } from '@/utils/supabase/server'
import { createCase } from './actions'

export default async function NewCasePage() {
  if (!hasSupabaseConfig()) {
    return <SetupNotice />
  }

  const supabase = await createClient()

  // Fetch contacts to populate the dropdown
  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, fiscal_code')
    .order('last_name', { ascending: true })

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center space-x-4">
        <Link href="/cases" className="text-gray-500 hover:text-gray-700">
          &larr; Indietro
        </Link>
        <h1 className="text-2xl font-bold">Nuova Pratica</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form action={createCase} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Titolo Pratica *
            </label>
            <input
              type="text"
              name="title"
              id="title"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="es. ISEE 2024, Domanda Disoccupazione..."
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
              Tipo di Pratica *
            </label>
            <select
              name="type"
              id="type"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="caf">CAF (es. ISEE, 730)</option>
              <option value="patronato">Patronato (es. Pensione, Disoccupazione)</option>
              <option value="invalidita_civile">Invalidità Civile</option>
            </select>
          </div>

          <div>
            <label htmlFor="contact_id" className="block text-sm font-medium text-gray-700">
              Contatto Associato *
            </label>
            <select
              name="contact_id"
              id="contact_id"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Seleziona un contatto...</option>
              {contacts?.map((c: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => (
                <option key={c.id} value={c.id}>
                  {c.last_name} {c.first_name} ({c.fiscal_code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Descrizione / Note Iniziali
            </label>
            <textarea
              name="description"
              id="description"
              rows={4}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <Link
              href="/cases"
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Annulla
            </Link>
            <button
              type="submit"
              className="bg-blue-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Crea Pratica
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
