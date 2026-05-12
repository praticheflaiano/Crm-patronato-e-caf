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
      <FormPageHeader
        backHref={`/contacts/${id}`}
        title="Modifica contatto"
        description="Aggiorna anagrafica, recapiti e indirizzo del cliente."
      />

      <FormCard title="Dati anagrafici" description="I campi contrassegnati con * sono obbligatori.">
        <form action={updateContact} className="space-y-5 p-6">
          <input type="hidden" name="id" value={contact.id} />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="first_name" className={labelClassName}>
                Nome *
              </label>
              <input
                id="first_name"
                name="first_name"
                required
                defaultValue={contact.first_name}
                placeholder="es. Maria"
                className={fieldClassName}
              />
            </div>
            <div>
              <label htmlFor="last_name" className={labelClassName}>
                Cognome *
              </label>
              <input
                id="last_name"
                name="last_name"
                required
                defaultValue={contact.last_name}
                placeholder="es. Rossi"
                className={fieldClassName}
              />
            </div>
          </div>

          <div>
            <label htmlFor="fiscal_code" className={labelClassName}>
              Codice fiscale *
            </label>
            <input
              id="fiscal_code"
              name="fiscal_code"
              required
              defaultValue={contact.fiscal_code}
              placeholder="es. RSSMRA80A01H501U"
              className={`${fieldClassName} uppercase`}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="email" className={labelClassName}>
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                defaultValue={contact.email ?? ''}
                placeholder="es. maria.rossi@email.it"
                className={fieldClassName}
              />
            </div>
            <div>
              <label htmlFor="phone" className={labelClassName}>
                Telefono
              </label>
              <input
                id="phone"
                name="phone"
                defaultValue={contact.phone ?? ''}
                placeholder="es. 333 123 4567"
                className={fieldClassName}
              />
            </div>
          </div>

          <div>
            <label htmlFor="date_of_birth" className={labelClassName}>
              Data di nascita
            </label>
            <input
              id="date_of_birth"
              name="date_of_birth"
              type="date"
              defaultValue={contact.date_of_birth ?? ''}
              className={fieldClassName}
            />
          </div>

          <div>
            <label htmlFor="address" className={labelClassName}>
              Indirizzo di residenza
            </label>
            <textarea
              id="address"
              name="address"
              rows={3}
              defaultValue={contact.address ?? ''}
              placeholder="Via, numero civico, CAP, citta"
              className={fieldClassName}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
            <Link href={`/contacts/${id}`} className={secondaryButtonClassName}>
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
