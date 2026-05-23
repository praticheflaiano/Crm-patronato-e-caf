import { sendAdminMagicLink } from './actions'
import Link from 'next/link'

export default async function AccessPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string }>
}) {
  const params = await searchParams

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="bg-white rounded-lg border shadow-sm p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-slate-950 text-center">Accesso diretto CRM</h1>
        <p className="mt-4 text-slate-600 text-center text-sm">
          Clicca il pulsante qui sotto per ricevere un <strong>magic link</strong> alla tua email 
          (<code className="bg-slate-100 px-1 rounded">praticheflaiano@gmail.com</code>) 
          e accedere direttamente al CRM.
        </p>

        {params.registered === '1' && (
          <div className="mt-4 rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700">
            ✅ Registration successful! Check your email to confirm your account, then click the button below to login.
          </div>
        )}

        <div className="mt-6">
          <form action={sendAdminMagicLink}>
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Invia magic link e accedi
            </button>
          </form>
        </div>

        <div className="mt-4 text-center">
          <Link href="/login" className="text-sm text-blue-600 hover:underline">
            ← Torna al login normale
          </Link>
        </div>
      </div>
    </main>
  )
}