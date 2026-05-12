export function SetupNotice() {
  return (
    <div className="mx-auto max-w-2xl rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-950">
      <h1 className="text-xl font-semibold">Configurazione richiesta</h1>
      <p className="mt-2 text-sm leading-6">
        Per usare il CRM devi creare un file .env.local con URL Supabase e chiave
        pubblicabile. Trovi un modello pronto in .env.example.
      </p>
    </div>
  )
}
