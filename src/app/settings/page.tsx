import { redirect } from 'next/navigation'
import { CheckCircle2, Settings, ShieldAlert, Users } from 'lucide-react'
import { SetupNotice } from '@/components/setup-notice'
import { hasSupabaseConfig } from '@/utils/supabase/config'
import { createClient } from '@/utils/supabase/server'
import { getOrCreateUserProfile, formatRole } from '@/lib/user-profile'
import { ProfileForm } from './profile-form'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ProfileRecord = Record<string, any>

// Diagnostics shown to admins: report whether key integrations are configured,
// WITHOUT ever exposing secret values (only presence is reported).
function getSystemChecks() {
  return [
    {
      label: 'Chiave service role (inviti medico)',
      ok: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      hint: "Necessaria per invitare un medico via email dalla scheda invalidità. Impostala su Vercel come SUPABASE_SERVICE_ROLE_KEY (solo Production, mai NEXT_PUBLIC).",
    },
    {
      label: 'Assistente AI (OpenRouter)',
      ok: Boolean(process.env.OPENROUTER_API_KEY),
      hint: 'Necessaria per la chat AI. Variabile OPENROUTER_API_KEY.',
    },
  ]
}

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
  const systemChecks = profile.role === 'admin' ? getSystemChecks() : []
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

      {/* System diagnostics — admin only */}
      {profile.role === 'admin' && (
        <section aria-labelledby="system-heading" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <ShieldAlert size={18} aria-hidden="true" />
            </div>
            <h2 id="system-heading" className="text-base font-semibold text-slate-950">
              Stato configurazione
            </h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">Verifica delle integrazioni del sistema. I valori segreti non vengono mai mostrati.</p>

          <ul className="mt-4 divide-y divide-slate-100">
            {systemChecks.map((check) => (
              <li key={check.label} className="flex items-start gap-3 py-3">
                {check.ok ? (
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />
                ) : (
                  <ShieldAlert size={18} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900">
                    {check.label}{' '}
                    <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-semibold ${check.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {check.ok ? 'Configurata' : 'Mancante'}
                    </span>
                  </p>
                  {!check.ok && <p className="mt-1 text-xs text-slate-500">{check.hint}</p>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

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
