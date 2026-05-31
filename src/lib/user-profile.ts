import { createClient } from '@/utils/supabase/server'

export type MemberStatus = 'pending' | 'active' | 'disabled'

export type UserProfile = {
  id: string
  full_name: string | null
  role: 'admin' | 'operator' | 'collaborator' | 'doctor'
  status: MemberStatus
  // Null while the account is pending approval (no organization assigned yet).
  organization_id: string | null
  organization_name: string
}

// A profile row is created automatically by the `on_auth_user_created` trigger on
// signup (role=operator, status=pending, no organization). We only ever READ it
// here: clients are no longer allowed to set their own role/organization/status,
// so new accounts stay locked out of organization data until an admin approves
// them via the `approve_member` RPC. See migrations `onboarding_*`.
export async function getOrCreateUserProfile(user: { id: string; email?: string | null }) {
  const supabase = await createClient()

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, full_name, role, status, organization_id, organizations(name)')
    .eq('id', user.id)
    .maybeSingle()

  if (!existingProfile) {
    return null
  }

  const profile = existingProfile as any /* eslint-disable-line @typescript-eslint/no-explicit-any */
  return {
    id: profile.id,
    full_name: profile.full_name,
    role: profile.role,
    status: (profile.status ?? 'pending') as MemberStatus,
    organization_id: profile.organization_id ?? null,
    organization_name: profile.organizations?.name ?? 'Centro Pratiche Flaiano',
  } satisfies UserProfile
}

// An account can use the CRM only once an admin has approved it (active + org set).
export function isActiveMember(profile: Pick<UserProfile, 'status' | 'organization_id'> | null): boolean {
  return !!profile && profile.status === 'active' && !!profile.organization_id
}

export function formatRole(role: UserProfile['role']) {
  const labels = {
    admin: 'Admin',
    operator: 'Operatore',
    collaborator: 'Collaboratore',
    doctor: 'Medico',
  }

  return labels[role]
}
