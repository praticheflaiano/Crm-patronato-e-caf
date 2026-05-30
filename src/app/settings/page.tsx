import { redirect } from 'next/navigation'
import { Settings, Users } from 'lucide-react'
import { SetupNotice } from '@/components/setup-notice'
import { hasSupabaseConfig } from '@/utils/supabase/config'
import { createClient } from '@/utils/supabase/server'
import { getOrCreateUserProfile, formatRole } from '@/lib/user-profile'
import { ProfileForm } from './profile-form'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ProfileRecord = Record<string, any>

export default async function SettingsPage() {
  if (!hasSupabaseConfig()) return <SetupNotice />

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const profile = await getOrCreateUserProfile(user)

  if (!profile) {
    redirect('/login')
  }

  let members: ProfileRecord[] = []
  if (profile.role === 'admin') {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('organization_id', profile.organization_id)
    members = Array.isArray(data) ? (data as ProfileRecord[]) : []
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Impostazioni</h1>
        <p className="mt-1 text-sm text-slate-500">Gestisci il tuo profilo e le preferenze dell&apos;account.</p>
      </div>

      {/* Profile section */}
      <section aria-labelledby="profile-heading" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <Settings size={18} aria-hidden="true" />
          </div>
          <h2 id="profile-heading" className="text-base font-semibold text-slate-950">
            Profilo
          </h2>
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Ruolo</dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">{formatRole(profile.role)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Organizzazione</dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">{profile.organization_name}</dd>
          </div>
        </dl>

        <div className="mt-5 border-t border-slate-100 pt-5">
          <ProfileForm initialName={profile.full_name ?? ''} />
        </div>
      </section>

      {/* Members section — admin only */}
      {profile.role === 'admin' && (
        <section aria-labelledby="members-heading" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <Users size={18} aria-hidden="true" />
            </div>
            <h2 id="members-heading" className="text-base font-semibold text-slate-950">
              Membri dell&apos;organizzazione
            </h2>
          </div>

          {members.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Nessun membro trovato.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      Nome
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      Ruolo
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900">
                        {member.full_name || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                        {formatRole(member.role)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
