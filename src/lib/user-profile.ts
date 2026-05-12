import { createClient } from '@/utils/supabase/server'

export type UserProfile = {
  id: string
  full_name: string | null
  role: 'admin' | 'operator' | 'collaborator' | 'doctor'
  organization_id: string
  organization_name: string
}

export async function getOrCreateUserProfile(user: { id: string; email?: string | null }) {
  const supabase = await createClient()

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, full_name, role, organization_id, organizations(name)')
    .eq('id', user.id)
    .maybeSingle()

  if (existingProfile) {
    const profile = existingProfile as any /* eslint-disable-line @typescript-eslint/no-explicit-any */
    return {
      id: profile.id,
      full_name: profile.full_name,
      role: profile.role,
      organization_id: profile.organization_id,
      organization_name: profile.organizations?.name ?? 'Centro Pratiche Flaiano',
    } satisfies UserProfile
  }

  const { data: organizationData, error: organizationError } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('slug', 'centro-pratiche-flaiano')
    .single()

  if (organizationError || !organizationData) {
    return null
  }

  const organization = organizationData as { id: string; name: string }

  const { data: newProfile, error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      organization_id: organization.id,
      full_name: user.email ?? null,
      role: 'operator',
    } as any /* eslint-disable-line @typescript-eslint/no-explicit-any */)
    .select('id, full_name, role, organization_id')
    .single()

  if (profileError || !newProfile) {
    return null
  }

  const createdProfile = newProfile as {
    id: string
    full_name: string | null
    role: UserProfile['role']
    organization_id: string
  }

  return {
    id: createdProfile.id,
    full_name: createdProfile.full_name,
    role: createdProfile.role,
    organization_id: createdProfile.organization_id,
    organization_name: organization.name,
  } satisfies UserProfile
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
