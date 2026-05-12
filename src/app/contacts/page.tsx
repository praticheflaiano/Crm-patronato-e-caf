import Link from "next/link"
import { createClient } from '@/utils/supabase/server'

export default async function ContactsPage() {
  const supabase = await createClient()

  // Example fetch, assuming RLS allows this (which requires auth)
  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('*')
    .order('last_name', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Contatti</h1>
        <Link href="/contacts/new" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
          Nuovo Contatto
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Codice Fiscale</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefono</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Azioni</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {error ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-red-500">
                  Errore nel caricamento dei contatti: {error.message}
                </td>
              </tr>
            ) : !contacts || contacts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  Nessun contatto trovato. (O non sei autenticato)
                </td>
              </tr>
            ) : (
              contacts.map((contact: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => (
                <tr key={contact.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {contact.last_name} {contact.first_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.fiscal_code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.email || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.phone || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a href="#" className="text-blue-600 hover:text-blue-900">Modifica</a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
