import { ClipboardList, Lock, Mail, User } from 'lucide-react'
import { login, signup } from './actions'

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-start justify-center overflow-y-auto bg-slate-100 px-4 py-4 sm:items-center sm:py-8">
      <div className="w-full max-w-xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <section className="bg-slate-950 px-5 py-5 text-white sm:px-8 sm:py-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
            <ClipboardList size={24} aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight sm:mt-6 sm:text-3xl">Centro Flaiano CRM</h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-300">
            Gestione operativa per contatti, pratiche CAF e patronato, documenti e scadenze.
          </p>
          <div className="mt-6 hidden space-y-3 text-sm text-slate-300 sm:block">
            <div className="rounded-md border border-white/10 bg-white/5 p-4">
              Pratiche e contatti in un unico spazio di lavoro.
            </div>
            <div className="rounded-md border border-white/10 bg-white/5 p-4">
              Accesso protetto con Supabase e dati isolati da RLS.
            </div>
          </div>
        </section>

        <section className="px-5 py-6 sm:px-8 sm:py-8">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">Accedi</h2>
            <p className="mt-2 text-sm text-slate-500">Inserisci le credenziali del tuo account.</p>
          </div>

          <form className="mt-6 space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-sm font-semibold text-slate-700">
                Email
              </label>
              <div className="relative mt-2">
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} aria-hidden="true" />
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full rounded-md border border-slate-300 py-2.5 pl-10 pr-3 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder=" tua@email.com "
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                Password
              </label>
              <div className="relative mt-2">
                <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} aria-hidden="true" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="block w-full rounded-md border border-slate-300 py-2.5 pl-10 pr-3 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Password"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                formAction={login}
                className="inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Accedi
              </button>
            </div>
          </form>

          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-slate-500">Nuovo account?</span>
            </div>
          </div>

          <form className="mt-6 space-y-4">
            <div>
              <label htmlFor="reg-name" className="block text-sm font-semibold text-slate-700">
                Nome e Cognome
              </label>
              <div className="relative mt-2">
                <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} aria-hidden="true" />
                <input
                  id="reg-name"
                  name="full_name"
                  type="text"
                  autoComplete="name"
                  required
                  minLength={2}
                  className="block w-full rounded-md border border-slate-300 py-2.5 pl-10 pr-3 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder=" Mario Rossi "
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-sm font-semibold text-slate-700">
                Email
              </label>
              <div className="relative mt-2">
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} aria-hidden="true" />
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full rounded-md border border-slate-300 py-2.5 pl-10 pr-3 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder=" tua@email.com "
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-sm font-semibold text-slate-700">
                Password
              </label>
              <div className="relative mt-2">
                <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} aria-hidden="true" />
                <input
                  id="reg-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  className="block w-full rounded-md border border-slate-300 py-2.5 pl-10 pr-3 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Minimo 6 caratteri"
                />
              </div>
            </div>

            <div>
              <button
                formAction={signup}
                className="inline-flex w-full items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Registra nuovo account
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}