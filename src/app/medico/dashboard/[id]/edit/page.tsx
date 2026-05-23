/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { SetupNotice } from '@/components/setup-notice'
import { hasSupabaseConfig } from '@/utils/supabase/config'
import { createClient } from '@/utils/supabase/server'
import { getOrCreateUserProfile } from '@/lib/user-profile'
import { InvaliditaForm } from '@/components/invalidita/InvaliditaForm'
import type { Database } from '@/types/database'

type InvalidityDetails = Database['public']['Tables']['invalidity_details']['Row']

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function DoctorEditCasePage({ params }: PageProps) {
  if (!hasSupabaseConfig()) {
    return <SetupNotice />
  }

  const { id } = await params
  const supabase = await createClient()

  // Verify user is a doctor
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const profile = await getOrCreateUserProfile(user)
  if (profile?.role !== 'doctor') {
    redirect('/')
  }

  // Fetch case with details, ensuring doctor has access
  const { data: caseData, error } = await supabase
    .from('cases')
    .select(`
      *,
      invalidity_details (*)
    `)
    .eq('id', id)
    .eq('type', 'invalidita_civile')
    .eq('doctor_id', user.id)
    .single()

  if (error || !caseData) {
    notFound()
  }

  const caseDataTyped = caseData as any

  const invalidityDetails = caseDataTyped.invalidity_details as InvalidityDetails | null

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/medico/dashboard/${id}`} className="text-sm font-medium text-slate-500 hover:text-slate-900">
          &larr; Indietro ai dettagli
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
          Modifica Pratica
        </h1>
        <p className="mt-1 text-sm text-slate-500">Aggiorna le informazioni sulla pratica.</p>
      </div>

      {/* Invalidita Form */}
      <InvaliditaForm
        caseId={id}
        existingData={invalidityDetails ?? undefined}
        isDoctorView={true}
      />
    </div>
  )
}