import Link from 'next/link'
import { AlertTriangle, Save } from 'lucide-react'
import {
  fieldClassName,
  FormCard,
  FormPageHeader,
  labelClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from '@/components/forms/form-layout'
import { CaseContactPicker } from '@/components/cases/case-contact-picker'
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

const errorMessages: Record<string, string> = {
  missing: 'Compila titolo, tipo di pratica e contatto.',
  profile: 'Profilo utente non disponibile. Riprova.',
  insert: 'Errore durante la creazione della pratica. Riprova.',
  contact: 'Per il nuovo contatto servono nome, cognome e codice fiscale.',
  contact_duplicate: 'Contatto non creato: il codice fiscale potrebbe essere già presente. Cerca il contatto tra quelli esistenti.',
}

export default async function NewCasePage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  if (!hasSupabaseConfig()) return <SetupNotice />

  const params = (await searchParams) ?? {}
  const selectedContactId = getParam(params, 'contactId') ?? ''
  const selectedTypeParam = getParam(params, 'type')
  const selectedType = CASE_TYPES.includes(selectedTypeParam as CaseType) ? (selectedTypeParam as CaseType) : CASE_TYPES[0]
  const errorKey = getParam(params, 'error') ?? ''
  const errorMessage = errorKey ? errorMessages[errorKey] ?? 'Si è verificato un errore. Riprova.' : null

  const supabase = await createClient()
  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, fiscal_code')
    .order('last_name', { ascending: true })

  const contactList = (contacts ?? []) as { id: string; first_name: string; last_name: string; fiscal_code: string }[]

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <FormPageHeader
        backHref="/cases"
        title="Nuova pratica"
        description="Crea una pratica CAF, patronato, invalidità civile o TARI Roma/AMA e collegala a un contatto nuovo o esistente."
      />

      {errorMessage ? (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-600" aria-hidden="true" />
          <p className="text-sm font-medium text-red-800">{errorMessage}</p>
        </div>
      ) : null}

      <FormCard title="Dati principali" description="I campi contrassegnati con * sono obbligatori.">
        <form action={createCase} className="space-y-5 p-4 sm:p-6">
          <div>
            <label htmlFor="title" className={labelClassName}>Titolo pratica *</label>
            <input type="text" name="title" id="title" required placeholder="es. ISEE 2026, domanda NASpI, invalidità civile, TARI Roma" className={fieldClassName} />
          </div>

          <div>
            <label htmlFor="type" className={labelClassName}>Tipo di pratica *</label>
            <select name="type" id="type" required defaultValue={selectedType} className={fieldClassName}>
              {CASE_TYPES.map((type) => <option key={type} value={type}>{CASE_TYPE_META[type].label}</option>)}
            </select>
          </div>

          <CaseContactPicker contacts={contactList} defaultContactId={selectedContactId} />

          <div>
            <label htmlFor="description" className={labelClassName}>Descrizione / note iniziali</label>
            <textarea name="description" id="description" rows={4} placeholder="Annota documenti richiesti, scadenze o dettagli utili per avviare la pratica." className={fieldClassName} />
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <Link href="/cases" className={secondaryButtonClassName}>Annulla</Link>
            <button type="submit" className={primaryButtonClassName}>
              <Save size={16} aria-hidden="true" />
              Crea pratica
            </button>
          </div>
        </form>
      </FormCard>
    </div>
  )
}
