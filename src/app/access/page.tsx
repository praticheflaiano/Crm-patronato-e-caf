import { redirect } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase/server'

const ADMIN_EMAIL = 'praticheflaiano@gmail.com'

export default async function AccessPage() {
  const supabaseAdmin = createAdminClient()

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: ADMIN_EMAIL,
    options: {
      redirectTo: 'http://localhost:3000',
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

  // Redirect directly to the Supabase magic link URL
  // Supabase will verify and redirect to redirectTo with session cookies
  redirect(data.properties.action_link)
}