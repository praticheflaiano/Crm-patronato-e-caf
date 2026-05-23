import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { createClient } from '@/utils/supabase/server'
import { hasSupabaseConfig } from '@/utils/supabase/config'
import { formatRole, getOrCreateUserProfile } from '@/lib/user-profile'
import { AppShell } from '@/components/app-shell'

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
      <body className={`${inter.className} min-h-dvh overflow-x-hidden bg-gray-50 text-gray-900 antialiased`}>
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
      </body>
    </html>
  )
}
