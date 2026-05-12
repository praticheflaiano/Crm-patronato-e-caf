import Link from 'next/link'
import { Save } from 'lucide-react'
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
import { createContact } from './actions'

export default function NewContactPage() {
  if (!hasSupabaseConfig()) {
    return <SetupNotice />
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <FormPageHeader
        backHref="/contacts"
        title="Nuovo contatto"
        description="Inserisci i dati anagrafici e i recapiti principali del cliente."
      />

      <FormCard title="Dati anagrafici" description="I campi contrassegnati con * sono obbligatori.">
        <form action={createContact} className="space-y-5 p-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="first_name" className={labelClassName}>
                Nome *
              </label>
              <input
                type="text"
                name="first_name"
                id="first_name"
                required
                placeholder="es. Maria"
                className={fieldClassName}
              />
            </div>
            <div>
              <label htmlFor="last_name" className={labelClassName}>
                Cognome *
              </label>
              <input
                type="text"
                name="last_name"
                id="last_name"
                required
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
              type="text"
              name="fiscal_code"
              id="fiscal_code"
              required
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
                type="email"
                name="email"
                id="email"
                placeholder="es. maria.rossi@email.it"
                className={fieldClassName}
              />
            </div>
            <div>
              <label htmlFor="phone" className={labelClassName}>
                Telefono
              </label>
              <input
                type="text"
                name="phone"
                id="phone"
                placeholder="es. 333 123 4567"
                className={fieldClassName}
              />
            </div>
          </div>

          <div>
            <label htmlFor="date_of_birth" className={labelClassName}>
              Data di nascita
            </label>
            <input type="date" name="date_of_birth" id="date_of_birth" className={fieldClassName} />
          </div>

          <div>
            <label htmlFor="address" className={labelClassName}>
              Indirizzo di residenza
            </label>
            <textarea
              name="address"
              id="address"
              rows={3}
              placeholder="Via, numero civico, CAP, citta"
              className={fieldClassName}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
            <Link href="/contacts" className={secondaryButtonClassName}>
              Annulla
            </Link>
            <button type="submit" className={primaryButtonClassName}>
              <Save size={16} aria-hidden="true" />
              Crea contatto
            </button>
          </div>
        </form>
      </FormCard>
    </div>
  )
}
