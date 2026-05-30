import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { createClient } from '@/utils/supabase/server'
import { hasSupabaseConfig } from '@/utils/supabase/config'
import { formatRole, getOrCreateUserProfile } from '@/lib/user-profile'
import { AppShell } from '@/components/app-shell'
import { ToastProvider } from '@/components/ui/toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CAF, Patronato e TARI Roma/AMA CRM',
  description: 'Gestione pratiche, contatti, documenti e TARI Roma/AMA per CAF, Patronato e servizi collegati',
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
      <body className={`${inter.className} min-h-dvh overflow-x-hidden bg-gray-50 text-gray-900 antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-md focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
        >
          Salta al contenuto
        </a>
        <ToastProvider>
          {isConfigured && user ? (
            <AppShell
              userLabel={profile?.full_name || user.email || 'Utente CRM'}
              organizationName={profile?.organization_name ?? 'CRM CAF e Patronato'}
              roleLabel={profile ? formatRole(profile.role) : 'Profilo in configurazione'}
              isDoctor={profile?.role === 'doctor'}
            >
              {children}
            </AppShell>
          ) : (
            children
          )}
        </ToastProvider>
      </body>
    </html>
  )
}
