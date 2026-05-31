/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { SetupNotice } from '@/components/setup-notice'
import { hasSupabaseConfig } from '@/utils/supabase/config'
import { createClient } from '@/utils/supabase/server'
import { MedicalCertificateForm } from '@/components/invalidita/MedicalCertificateForm'
import { getOrCreateUserProfile } from '@/lib/user-profile'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function NewCertificatePage({ params }: PageProps) {
  if (!hasSupabaseConfig()) {
    return <SetupNotice />
  }

  const { id: caseId } = await params
  const supabase = await createClient()

  // Verify user is authorized
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const profile = await getOrCreateUserProfile(user)
  if (!profile || !['admin', 'operator', 'doctor'].includes(profile.role)) {
    redirect('/')
  }

  // If doctor, verify they're a collaborator on this case (source of truth)
  if (profile.role === 'doctor') {
    const { data: membership } = await (supabase as any)
      .from('case_collaborators')
      .select('id')
      .eq('case_id', caseId)
      .eq('user_id', user.id)
      .eq('role', 'doctor')
      .maybeSingle()

    // Ensure the case is actually an invalidità civile case
    const { data: caseData } = await supabase
      .from('cases')
      .select('id')
      .eq('id', caseId)
      .eq('type', 'invalidita_civile')
      .single()

    if (!membership || !caseData) {
      notFound()
    }
  } else {
    // Verify case exists for admin/operator
    const { data: caseData } = await supabase
      .from('cases')
      .select('id, title')
      .eq('id', caseId)
      .eq('type', 'invalidita_civile')
      .single()

    if (!caseData) {
      notFound()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/invalidita-civile/${caseId}`} className="text-sm font-medium text-slate-500 hover:text-slate-900">
          &larr; Indietro ai dettagli
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
          Nuovo Certificato Medico
        </h1>
        <p className="mt-1 text-sm text-slate-500">Aggiungi un nuovo certificato medico alla pratica.</p>
      </div>

      <MedicalCertificateForm caseId={caseId} />
    </div>
  )
}