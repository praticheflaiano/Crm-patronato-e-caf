import { redirect } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase/server'

export default async function AccessPage() {
  const supabaseAdmin = createAdminClient()

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: 'praticheflaiano@gmail.com',
    options: {
      redirectTo: 'https://crm-patronato-e-caf.vercel.app/auth/callback',
    },
  })

  if (error || !data?.properties?.action_link) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="bg-white rounded-lg border p-8 text-center max-w-md">
          <h1 className="text-xl font-bold text-red-600">Errore</h1>
          <p className="mt-2 text-slate-600">{error?.message ?? 'Failed to generate link'}</p>
          <a href="/access" className="mt-4 inline-block text-blue-600 hover:underline">Riprova</a>
        </div>
      </main>
    )
  }

  // Show the link as a clickable button — user clicks → Supabase verifies → redirected to callback
  const magicLink = data.properties.action_link

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="bg-white rounded-lg border p-8 text-center max-w-md w-full">
        <h1 className="text-xl font-bold text-slate-950">Accesso diretto CRM</h1>
        <p className="mt-3 text-slate-600 text-sm">
          Clicca il pulsante qui sotto per accedere come amministratore.
          Si aprirà una pagina di conferma e verrai reindirizzato automaticamente.
        </p>

        <a
          href={magicLink}
          className="mt-6 inline-block w-full rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white text-center hover:bg-blue-700"
        >
          Accedi al CRM
        </a>

        <p className="mt-4 text-xs text-slate-400">
          Non riceverai nessuna email — il link funziona direttamente.
        </p>
      </div>
    </main>
  )
}