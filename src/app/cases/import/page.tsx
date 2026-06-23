import { ImportCasesForm } from './import-form'

export const metadata = { title: 'Importa Pratiche' }

export default function ImportCasesPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Importa Pratiche</h1>
        <p className="mt-2 text-sm text-slate-500">
          Carica un file CSV per aggiungere pratiche in blocco. Il file deve avere una riga di intestazione (header). Le pratiche verranno associate ai clienti usando il loro codice fiscale.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-slate-900">Istruzioni CSV</h2>
        <ul className="mb-6 list-inside list-disc space-y-2 text-sm text-slate-600">
          <li>Sono richiesti i seguenti campi: <strong>Titolo</strong>, <strong>Tipo</strong>, <strong>Stato</strong> e <strong>Codice Fiscale</strong> (del cliente).</li>
          <li>Separatore accettato: virgola (<code>,</code>) o punto e virgola (<code>;</code>).</li>
          <li>Massimo 2000 righe e 5 MB di peso.</li>
          <li>Le pratiche verranno saltate se il codice fiscale non appartiene a nessun cliente in anagrafica.</li>
        </ul>

        <div className="mb-8 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Esempio CSV</p>
          <pre className="text-sm text-slate-700">
            titolo,tipo,stato,codice_fiscale<br />
            &quot;Dichiarazione redditi 2023&quot;,caf,da_iniziare,RSSMRA80A01H501U<br />
            &quot;Richiesta invalidità&quot;,invalidita_civile,in_lavorazione,BNCLDA85M41F205H
          </pre>
        </div>

        <ImportCasesForm />
      </div>
    </div>
  )
}
