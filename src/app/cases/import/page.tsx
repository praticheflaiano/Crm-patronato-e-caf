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
        description="Carica pratiche esistenti in pochi secondi. Le pratiche con lo stesso numero pratica (se presente) o stesse informazioni chiave verranno inserite e associate ai contatti tramite Codice Fiscale."
      />

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <FileSpreadsheet className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold">Formato del file</p>
            <p className="mt-1">
              La prima riga deve contenere le intestazioni. Colonne riconosciute (italiano o inglese):
              <strong> Titolo</strong>, <strong>Codice Fiscale Contatto</strong> (obbligatorio per associazione),
              <strong> Tipo</strong> (caf, patronato, invalidita_civile, tari), <strong> Stato</strong> (open, in_progress, etc.),
              ed eventuali <strong>Descrizione</strong>.
            </p>
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
