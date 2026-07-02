import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getOrCreateUserProfile } from '@/lib/user-profile'
import { ImportCasesForm } from './import-form'

export const metadata = {
  title: 'Importa Pratiche CSV | CRM Flaiano',
}

export default async function ImportCasesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const profile = await getOrCreateUserProfile(user)

  if (!profile?.organization_id || profile.role === 'collaborator' || profile.role === 'doctor') {
    redirect('/')
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Importa Pratiche da CSV</h1>
        <p className="mt-2 text-sm text-slate-600">
          Carica un file CSV per importare massivamente nuove pratiche. Il file deve contenere
          le seguenti colonne obbligatorie: <span className="font-semibold">Titolo, Tipo, Codice Fiscale Cliente</span>.
        </p>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <ImportCasesForm />
      </div>
    </div>
  )
}
