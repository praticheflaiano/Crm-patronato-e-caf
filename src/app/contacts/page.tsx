import Link from 'next/link'
import { Download, Mail, Phone, Plus, Search, Users } from 'lucide-react'
import { SetupNotice } from '@/components/setup-notice'
import { hasSupabaseConfig } from '@/utils/supabase/config'
import { createClient } from '@/utils/supabase/server'

type SearchParams = Record<string, string | string[] | undefined>
type ContactRecord = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

function getParam(params: SearchParams, key: string) {
  const value = params[key]
  return Array.isArray(value) ? value[0] : value
}

export default async function ContactsPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  if (!hasSupabaseConfig()) return <SetupNotice />

  const params = (await searchParams) ?? {}
  const q = (getParam(params, 'q') ?? '').trim().toLowerCase()

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('contacts')
    .select('*, cases(id, status, type, created_at)')
    .order('last_name', { ascending: true })

  const contacts = Array.isArray(data) ? data as ContactRecord[] : []
  const filteredContacts = contacts.filter(contact => {
    const haystack = [contact.first_name, contact.last_name, contact.fiscal_code, contact.email, contact.phone].filter(Boolean).join(' ').toLowerCase()
    return !q || haystack.includes(q)
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Contatti</h1>
          <p className="mt-1 text-sm text-slate-500">Anagrafica clienti, recapiti e pratiche collegate.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Link href="/contacts/export" download className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
            <Download size={16} aria-hidden="true" />
            Esporta CSV
          </Link>
          <Link href="/contacts/new" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
            <Plus size={16} aria-hidden="true" />
            Nuovo Contatto
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <form className="border-b border-slate-200 p-4 sm:p-5">
          <div className="relative">
            <Search size={17} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Cerca per nome, cognome, codice fiscale, telefono o email..."
              className="block w-full rounded-md border border-slate-300 py-2.5 pl-10 pr-3 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-sm"
            />
          </div>
        </form>

        {error ? (
          <div className="p-8 text-center text-sm text-red-600">Errore nel caricamento dei contatti: {error.message}</div>
        ) : filteredContacts.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
              <Users size={20} aria-hidden="true" />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-700">Nessun contatto trovato</p>
            <p className="mt-1 text-sm text-slate-500">Prova a cercare per codice fiscale o numero di telefono.</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 p-3 md:hidden">
              {filteredContacts.map(contact => {
                const activeCases = Array.isArray(contact.cases) ? contact.cases.filter((item: ContactRecord) => item.status !== 'completed' && item.status !== 'rejected').length : 0
                return (
                  <Link key={contact.id} href={`/contacts/${contact.id}`} className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm active:bg-slate-50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="break-words text-sm font-semibold text-slate-950">{contact.last_name} {contact.first_name}</h2>
                        <p className="mt-1 break-words text-xs font-medium text-slate-500">{contact.fiscal_code}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{activeCases} attive</span>
                    </div>
                    <div className="mt-3 space-y-1 text-xs text-slate-600">
                      <p className="flex items-center gap-2 break-all"><Mail size={13} /> {contact.email || 'Email mancante'}</p>
                      <p className="flex items-center gap-2"><Phone size={13} /> {contact.phone || 'Telefono mancante'}</p>
                    </div>
                  </Link>
                )
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">Nome</th>
                    <th scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">Codice Fiscale</th>
                    <th scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">Email</th>
                    <th scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">Telefono</th>
                    <th scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">Pratiche</th>
                    <th scope="col" className="px-5 py-3 text-right text-xs font-semibold uppercase text-slate-500">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredContacts.map(contact => (
                    <tr key={contact.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-950">{contact.last_name} {contact.first_name}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{contact.fiscal_code}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{contact.email || '-'}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{contact.phone || '-'}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{Array.isArray(contact.cases) ? contact.cases.length : 0}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold">
                        <Link href={`/contacts/${contact.id}`} className="text-blue-700 hover:text-blue-900">Dettagli</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
