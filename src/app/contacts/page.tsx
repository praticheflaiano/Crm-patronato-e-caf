import Link from 'next/link'
import { Plus, Search, Users } from 'lucide-react'
import { SetupNotice } from '@/components/setup-notice'
import { hasSupabaseConfig } from '@/utils/supabase/config'
import { createClient } from '@/utils/supabase/server'

export default async function ContactsPage() {
  if (!hasSupabaseConfig()) {
    return <SetupNotice />
  }

  const supabase = await createClient()
  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('*')
    .order('last_name', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Contatti</h1>
          <p className="mt-1 text-sm text-slate-500">Anagrafica clienti e recapiti principali.</p>
        </div>
        <Link href="/contacts/new" className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
          <Plus size={16} aria-hidden="true" />
          Nuovo Contatto
        </Link>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4 text-sm text-slate-500">
          <Search size={17} aria-hidden="true" />
          Ricerca e filtri saranno disponibili nella prossima fase.
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">Nome</th>
                <th scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">Codice Fiscale</th>
                <th scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">Email</th>
                <th scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">Telefono</th>
                <th scope="col" className="px-5 py-3 text-right text-xs font-semibold uppercase text-slate-500">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {error ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-red-600">
                    Errore nel caricamento dei contatti: {error.message}
                  </td>
                </tr>
              ) : !contacts || contacts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                      <Users size={20} aria-hidden="true" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-700">Nessun contatto trovato</p>
                    <p className="mt-1 text-sm text-slate-500">Crea il primo contatto per iniziare a collegare le pratiche.</p>
                  </td>
                </tr>
              ) : (
                contacts.map((contact: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => (
                  <tr key={contact.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-950">
                      {contact.last_name} {contact.first_name}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{contact.fiscal_code}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{contact.email || '-'}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{contact.phone || '-'}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold">
                      <span className="text-slate-400">Modifica</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
