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

  // If doctor, verify they're assigned to this case
  if (profile.role === 'doctor') {
    const { data: caseData } = await supabase
      .from('cases')
      .select('doctor_id')
      .eq('id', caseId)
      .eq('type', 'invalidita_civile')
      .single()

    const caseDataTyped = caseData as { doctor_id: string | null } | null

    if (!caseDataTyped || caseDataTyped.doctor_id !== user.id) {
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