import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import { ClipboardList, FolderKanban, Home, LogOut, MessageSquare, Users, Stethoscope } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { hasSupabaseConfig } from '@/utils/supabase/config'
import { formatRole, getOrCreateUserProfile } from '@/lib/user-profile'
import { logout } from './login/actions'
import NotificationBell from '@/components/notifications/NotificationBell'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CAF & Patronato CRM',
  description: 'Gestione pratiche e contatti per CAF e Patronato',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isConfigured = hasSupabaseConfig()
  const user = isConfigured
    ? (await (await createClient()).auth.getUser()).data.user
    : null
  const profile = user ? await getOrCreateUserProfile(user) : null

  return (
    <html lang="it">
      <body className={`${inter.className} bg-gray-50 text-gray-900 antialiased`}>
        {isConfigured && user ? (
          <div className="flex min-h-screen overflow-hidden bg-slate-100">
            <aside className="flex w-72 shrink-0 flex-col border-r border-slate-200 bg-white">
              <div className="flex h-20 items-center gap-3 border-b border-slate-200 px-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <ClipboardList size={21} aria-hidden="true" />
                </div>
                <div>
                  <h1 className="text-base font-bold leading-5 text-slate-950">Centro Flaiano</h1>
                  <p className="text-xs font-medium text-slate-500">{profile?.organization_name ?? 'CRM CAF e Patronato'}</p>
                </div>
              </div>
              <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
                <Link href="/" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950">
                  <Home size={17} aria-hidden="true" />
                  Dashboard
                </Link>
                <Link href="/contacts" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950">
                  <Users size={17} aria-hidden="true" />
                  Contatti
                </Link>
                <Link href="/cases" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950">
                  <FolderKanban size={17} aria-hidden="true" />
                  Pratiche
                </Link>
                <Link href="/invalidita-civile" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950">
                  <FolderKanban size={17} aria-hidden="true" />
                  Invalidità Civile
                </Link>
                <Link href="/chat" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950">
                  <MessageSquare size={17} aria-hidden="true" />
                  Assistente AI
                </Link>
                {profile?.role === 'doctor' && (
                  <Link href="/medico/dashboard" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-purple-700 hover:bg-purple-50 hover:text-purple-900">
                    <Stethoscope size={17} aria-hidden="true" />
                    Dashboard Medico
                  </Link>
                )}
              </nav>
              <div className="border-t border-slate-200 p-4">
                <div className="mb-3 rounded-md bg-slate-50 p-3">
                  <div className="truncate text-sm font-semibold text-slate-800" title={profile?.full_name || user.email || ''}>
                    {profile?.full_name || user.email}
                  </div>
                  <div className="mt-1 text-xs font-medium text-slate-500">
                    {profile ? formatRole(profile.role) : 'Profilo in configurazione'}
                  </div>
                </div>
                <form action={logout}>
                   <button type="submit" className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50">
                     <LogOut size={17} aria-hidden="true" />
                     Logout
                   </button>
                </form>
              </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
              <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{profile?.organization_name ?? 'CRM System'}</h2>
                  <p className="text-xs text-slate-400">Gestione operativa pratiche e clienti</p>
                </div>
                <div className="flex items-center gap-4">
                  <NotificationBell />
                </div>
              </header>
              <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
                {children}
              </main>
            </div>
          </div>
        ) : (
          // If not authenticated, just render children (which should be the login page due to middleware)
          children
        )}
      </body>
    </html>
  )
}
