import Link from 'next/link'
import { Save, UserPlus } from 'lucide-react'
import {
  fieldClassName,
  FormCard,
  FormPageHeader,
  labelClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from '@/components/forms/form-layout'
import { SetupNotice } from '@/components/setup-notice'
import { CASE_TYPES, CASE_TYPE_META, type CaseType } from '@/lib/case-workflow'
import { hasSupabaseConfig } from '@/utils/supabase/config'
import { createClient } from '@/utils/supabase/server'
import { createCase } from './actions'

type SearchParams = Record<string, string | string[] | undefined>
function getParam(params: SearchParams, key: string) {
  const value = params[key]
  return Array.isArray(value) ? value[0] : value
}

export default async function NewCasePage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  if (!hasSupabaseConfig()) return <SetupNotice />

  const params = (await searchParams) ?? {}
  const selectedContactId = getParam(params, 'contactId') ?? ''
  const selectedTypeParam = getParam(params, 'type')
  const selectedType = CASE_TYPES.includes(selectedTypeParam as CaseType) ? (selectedTypeParam as CaseType) : CASE_TYPES[0]

  const supabase = await createClient()
  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, fiscal_code')
    .order('last_name', { ascending: true })

  const hasContacts = Boolean(contacts?.length)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <FormPageHeader
        backHref="/cases"
        title="Nuova pratica"
        description="Crea una pratica CAF, patronato, invalidità civile o TARI Roma/AMA e collegala a un contatto."
      />

      {!hasContacts ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-900">Prima serve almeno un contatto</p>
              <p className="mt-1 text-sm text-amber-800">Le pratiche devono essere associate a un cliente già registrato.</p>
            </div>
            <Link href="/contacts/new" className={secondaryButtonClassName}>
              <UserPlus size={16} aria-hidden="true" />
              Nuovo contatto
            </Link>
          </div>
        </div>
      ) : null}

      <FormCard title="Dati principali" description="I campi contrassegnati con * sono obbligatori.">
        <form action={createCase} className="space-y-5 p-4 sm:p-6">
          <div>
            <label htmlFor="title" className={labelClassName}>Titolo pratica *</label>
            <input type="text" name="title" id="title" required placeholder="es. ISEE 2026, domanda NASpI, invalidità civile, TARI Roma" className={fieldClassName} />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="type" className={labelClassName}>Tipo di pratica *</label>
              <select name="type" id="type" required defaultValue={selectedType} className={fieldClassName}>
                {CASE_TYPES.map((type) => <option key={type} value={type}>{CASE_TYPE_META[type].label}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="contact_id" className={labelClassName}>Contatto associato *</label>
              <select name="contact_id" id="contact_id" required disabled={!hasContacts} defaultValue={selectedContactId} className={fieldClassName}>
                <option value="">Seleziona un contatto...</option>
                {contacts?.map((contact: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                  <option key={contact.id} value={contact.id}>{contact.last_name} {contact.first_name} ({contact.fiscal_code})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="description" className={labelClassName}>Descrizione / note iniziali</label>
            <textarea name="description" id="description" rows={4} placeholder="Annota documenti richiesti, scadenze o dettagli utili per avviare la pratica." className={fieldClassName} />
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <Link href="/cases" className={secondaryButtonClassName}>Annulla</Link>
            <button type="submit" disabled={!hasContacts} className={`${primaryButtonClassName} disabled:cursor-not-allowed disabled:bg-slate-300`}>
              <Save size={16} aria-hidden="true" />
              Crea pratica
            </button>
          </div>
        </form>
      </FormCard>
    </div>
  )
}
