'use server'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { getSafeErrorMessage } from '@/lib/supabase-errors'

const ROLES = ['admin', 'operator', 'collaborator', 'doctor'] as const
const STATUSES = ['pending', 'active', 'disabled'] as const

type Role = (typeof ROLES)[number]
type Status = (typeof STATUSES)[number]

export type MemberActionResult = { ok: true } | { ok: false; error: string }

// Grant or revoke a member's access. All authorization (caller must be an active
// admin) is enforced server-side inside the `approve_member` Postgres function,
// which is the only path allowed to write role/organization/status. See the
// `onboarding_*` migrations.
export async function setMemberAccess(formData: FormData): Promise<MemberActionResult> {
  const targetId = String(formData.get('targetId') || '')
  const role = String(formData.get('role') || '')
  const status = String(formData.get('status') || '')

  if (!targetId) return { ok: false, error: 'Utente non valido.' }
  if (!ROLES.includes(role as Role)) return { ok: false, error: 'Ruolo non valido.' }
  if (!STATUSES.includes(status as Status)) return { ok: false, error: 'Stato non valido.' }

  const supabase = await createClient()
  // `approve_member` is a security-definer RPC not present in the generated
  // Database types, so the client is cast to call it.
  const { error } = await (supabase as any).rpc('approve_member', {
    target_id: targetId,
    new_role: role as Role,
    new_status: status as Status,
  })

  if (error) {
    return { ok: false, error: getSafeErrorMessage(error) }
  }

  revalidatePath('/admin/utenti')
  return { ok: true }
}
