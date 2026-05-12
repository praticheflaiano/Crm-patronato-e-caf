import Link from 'next/link'
import { Save } from 'lucide-react'
import { notFound } from 'next/navigation'
import {
  fieldClassName,
  FormCard,
  FormPageHeader,
  labelClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from '@/components/forms/form-layout'
import { SetupNotice } from '@/components/setup-notice'
import { CASE_STATUS_META, CASE_TYPES, CASE_TYPE_META, getCaseStatusOptions, type CaseStatus } from '@/lib/case-workflow'
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
  const statusOptions = getCaseStatusOptions(caseItem.status as CaseStatus | null)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <FormPageHeader
        backHref={`/cases/${id}`}
        title="Modifica pratica"
        description="Aggiorna dati principali, contatto collegato e stato di avanzamento."
      />

      <FormCard title="Dati principali" description="Gli stati selezionabili rispettano il flusso operativo configurato.">
        <form action={updateCase} className="space-y-5 p-6">
          <input type="hidden" name="id" value={caseItem.id} />

          <div>
            <label htmlFor="title" className={labelClassName}>Titolo pratica *</label>
            <input
              id="title"
              name="title"
              required
              defaultValue={caseItem.title}
              placeholder="es. ISEE 2026, domanda NASpI, invalidita civile"
              className={fieldClassName}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="type" className={labelClassName}>Tipo di pratica *</label>
              <select id="type" name="type" required defaultValue={caseItem.type} className={fieldClassName}>
                {CASE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {CASE_TYPE_META[type].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="status" className={labelClassName}>Stato *</label>
              <select id="status" name="status" required defaultValue={caseItem.status ?? 'open'} className={fieldClassName}>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {CASE_STATUS_META[status].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="contact_id" className={labelClassName}>Contatto associato *</label>
            <select id="contact_id" name="contact_id" required defaultValue={caseItem.contact_id ?? ''} className={fieldClassName}>
              <option value="">Seleziona un contatto...</option>
              {contacts?.map((contact: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => (
                <option key={contact.id} value={contact.id}>
                  {contact.last_name} {contact.first_name} ({contact.fiscal_code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="description" className={labelClassName}>Descrizione / note</label>
            <textarea
              id="description"
              name="description"
              rows={5}
              defaultValue={caseItem.description ?? ''}
              placeholder="Annota documenti richiesti, scadenze o dettagli utili per la lavorazione."
              className={fieldClassName}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
            <Link href={`/cases/${id}`} className={secondaryButtonClassName}>
              Annulla
            </Link>
            <button type="submit" className={primaryButtonClassName}>
              <Save size={16} aria-hidden="true" />
              Salva modifiche
            </button>
          </div>
        </form>
      </FormCard>
    </div>
  )
}
