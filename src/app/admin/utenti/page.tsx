import { redirect } from 'next/navigation'
import { UserCog } from 'lucide-react'
import { SetupNotice } from '@/components/setup-notice'
import { hasSupabaseConfig } from '@/utils/supabase/config'
import { createClient } from '@/utils/supabase/server'
import { getOrCreateUserProfile, isActiveMember } from '@/lib/user-profile'
import { UserManagementClient, type ManagedMember } from './user-management-client'

export const metadata = {
  title: 'Gestione utenti',
}

export default async function AdminUsersPage() {
  if (!hasSupabaseConfig()) {
    return <SetupNotice />
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const profile = await getOrCreateUserProfile(user)

  // Only active admins may manage members. The approve_member RPC enforces this
  // again server-side, but we also gate the page so the UI isn't reachable.
  if (!isActiveMember(profile) || profile?.role !== 'admin') {
    redirect('/')
  }

  // The "Admins can view member profiles" RLS policy limits this to org members
  // plus pending applicants — no service role needed.
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, status')
    .order('status', { ascending: true })
    .order('full_name', { ascending: true })

  const members = (data ?? []) as ManagedMember[]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <UserCog size={24} aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Gestione utenti</h1>
          <p className="mt-1 text-sm text-slate-500">
            Approva le nuove registrazioni e gestisci ruoli e accessi del team.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          Errore nel caricamento degli utenti: {error.message}
        </div>
      ) : (
        <UserManagementClient members={members} currentUserId={user.id} />
      )}
    </div>
  )
}
