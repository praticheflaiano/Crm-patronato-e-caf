import { FileSpreadsheet } from 'lucide-react'
import { FormCard, FormPageHeader } from '@/components/forms/form-layout'
import { SetupNotice } from '@/components/setup-notice'
import { hasSupabaseConfig } from '@/utils/supabase/config'
import { ImportCasesForm } from './import-form'

export default function ImportCasesPage() {
  if (!hasSupabaseConfig()) return <SetupNotice />

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <FormPageHeader
        backHref="/cases"
        title="Importa pratiche da CSV"
        description="Carica uno storico di pratiche. Il contatto associato deve essere già presente in anagrafica ed è identificato dal Codice Fiscale."
      />

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <FileSpreadsheet className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold">Formato del file</p>
            <p className="mt-1">
              La prima riga deve contenere le intestazioni. Colonne riconosciute:
              <strong> Titolo</strong>, <strong>Tipo</strong>, <strong>Codice Fiscale</strong> (obbligatorie),
              ed eventuali <strong>Stato</strong>, <strong>Descrizione</strong>.
            </p>
            <ul className="mt-2 list-disc list-inside">
              <li><strong>Tipo</strong> validi: <code>caf</code>, <code>patronato</code>, <code>invalidita_civile</code>, <code>tari</code></li>
              <li><strong>Stato</strong> validi: <code>open</code>, <code>in_progress</code>, <code>pending_documents</code>, <code>completed</code>, <code>rejected</code></li>
              <li>Il <strong>Codice Fiscale</strong> collega la pratica al contatto. Se non trovato, la riga viene saltata.</li>
            </ul>
          </div>
        </div>
      </div>

      <FormCard title="Carica file" description="Dimensione massima 5 MB, fino a 2000 righe.">
        <div className="p-4 sm:p-6">
          <ImportCasesForm />
        </div>
      </FormCard>
    </div>
  )
}
