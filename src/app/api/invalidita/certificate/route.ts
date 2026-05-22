import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const formData = await request.formData()
    
    const caseId = formData.get('caseId') as string
    const certificate_type = formData.get('certificate_type') as string
    const certificate_number = formData.get('certificate_number') as string | null
    const certificate_series = formData.get('certificate_series') as string | null
    const doctor_name = formData.get('doctor_name') as string
    const doctor_tax_code = formData.get('doctor_tax_code') as string | null
    const doctor_phone = formData.get('doctor_phone') as string | null
    const doctor_email = formData.get('doctor_email') as string | null
    const doctor_address = formData.get('doctor_address') as string | null
    const doctor_structure = formData.get('doctor_structure') as string | null
    const asl_code = formData.get('asl_code') as string | null
    const diagnosis = formData.get('diagnosis') as string
    const icd_code = formData.get('icd_code') as string | null
    const clinical_findings = formData.get('clinical_findings') as string | null
    const functional_limitations = formData.get('functional_limitations') as string | null
    const prognosis = formData.get('prognosis') as string | null
    const therapy_prescribed = formData.get('therapy_prescribed') as string | null
    const issue_date = formData.get('issue_date') as string
    const expiry_date = formData.get('expiry_date') as string | null
    const visit_date = formData.get('visit_date') as string | null
    const digital_signature_present = formData.get('digital_signature_present') === 'true'
    const signature_date = formData.get('signature_date') as string | null
    const document_path = formData.get('document_path') as string | null

    // Get user's profile to check role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ ok: false, message: 'Non autorizzato' }, { status: 401 })
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (!profileData) {
      return NextResponse.json({ ok: false, message: 'Profilo non trovato' }, { status: 404 })
    }

    const profile = profileData as { role: string; organization_id: string }

    // Only admin, operator, or doctor can create medical certificates
    if (!['admin', 'operator', 'doctor'].includes(profile.role)) {
      return NextResponse.json({ ok: false, message: 'Non autorizzato a gestire certificati medici' }, { status: 403 })
    }

    // If doctor, verify they're assigned to this case
    if (profile.role === 'doctor') {
      const { data: caseDataRaw } = await supabase
        .from('cases')
        .select('doctor_id')
        .eq('id', caseId)
        .single()

      const caseData = caseDataRaw as { doctor_id: string | null } | null

      if (caseData?.doctor_id !== user.id) {
        return NextResponse.json({ ok: false, message: 'Non autorizzato per questa pratica' }, { status: 403 })
      }
    }

    // Create the medical certificate
    const { data, error } = await (supabase as any)
      .from('medical_certificates')
      .insert({
        case_id: caseId,
        certificate_type,
        certificate_number,
        certificate_series,
        doctor_name,
        doctor_tax_code,
        doctor_phone,
        doctor_email,
        doctor_address,
        doctor_structure,
        asl_code,
        diagnosis,
        icd_code,
        clinical_findings,
        functional_limitations,
        prognosis,
        therapy_prescribed,
        issue_date,
        expiry_date,
        visit_date,
        digital_signature_present,
        signature_date,
        organization_id: profile.organization_id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating medical certificate:', error)
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
    }

    // If document was uploaded, update the certificate with document reference
    if (document_path) {
      const { data: docData } = await (supabase as any)
        .from('documents')
        .insert({
          case_id: caseId,
          file_name: document_path.split('/').pop() || 'certificate',
          file_path: document_path,
          file_type: 'application/pdf',
          organization_id: profile.organization_id,
        })
        .select()
        .single()

      if (docData) {
        await (supabase as any)
          .from('medical_certificates')
          .update({ document_id: docData.id })
          .eq('id', data.id)
      }
    }

    revalidatePath('/invalidita-civile')
    revalidatePath(`/invalidita-civile/${caseId}`)

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    console.error('Error in POST /api/invalidita/certificate:', error)
    return NextResponse.json({ ok: false, message: 'Errore interno del server' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const formData = await request.formData()
    
    const certificateId = formData.get('certificateId') as string
    const certificate_type = formData.get('certificate_type') as string
    const certificate_number = formData.get('certificate_number') as string | null
    const certificate_series = formData.get('certificate_series') as string | null
    const doctor_name = formData.get('doctor_name') as string
    const doctor_tax_code = formData.get('doctor_tax_code') as string | null
    const doctor_phone = formData.get('doctor_phone') as string | null
    const doctor_email = formData.get('doctor_email') as string | null
    const doctor_address = formData.get('doctor_address') as string | null
    const doctor_structure = formData.get('doctor_structure') as string | null
    const asl_code = formData.get('asl_code') as string | null
    const diagnosis = formData.get('diagnosis') as string
    const icd_code = formData.get('icd_code') as string | null
    const clinical_findings = formData.get('clinical_findings') as string | null
    const functional_limitations = formData.get('functional_limitations') as string | null
    const prognosis = formData.get('prognosis') as string | null
    const therapy_prescribed = formData.get('therapy_prescribed') as string | null
    const issue_date = formData.get('issue_date') as string
    const expiry_date = formData.get('expiry_date') as string | null
    const visit_date = formData.get('visit_date') as string | null
    const digital_signature_present = formData.get('digital_signature_present') === 'true'
    const signature_date = formData.get('signature_date') as string | null
    const is_valid = formData.get('is_valid') === 'true'
    const verification_status = formData.get('verification_status') as string
    const verification_notes = formData.get('verification_notes') as string | null

    // Get user's profile to check role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ ok: false, message: 'Non autorizzato' }, { status: 401 })
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profileData) {
      return NextResponse.json({ ok: false, message: 'Profilo non trovato' }, { status: 404 })
    }

    const profile = profileData as { role: string }

    // Only admin, operator, or doctor can update medical certificates
    if (!['admin', 'operator', 'doctor'].includes(profile.role)) {
      return NextResponse.json({ ok: false, message: 'Non autorizzato a gestire certificati medici' }, { status: 403 })
    }

    // Get the certificate to find the case
    const { data: existingCert } = await (supabase as any)
      .from('medical_certificates')
      .select('case_id')
      .eq('id', certificateId)
      .single()

    if (!existingCert) {
      return NextResponse.json({ ok: false, message: 'Certificato non trovato' }, { status: 404 })
    }

    // If doctor, verify they're assigned to this case
    if (profile.role === 'doctor') {
      const { data: caseDataRaw } = await (supabase as any)
        .from('cases')
        .select('doctor_id')
        .eq('id', existingCert.case_id)
        .single()

      const caseData = caseDataRaw as { doctor_id: string | null } | null

      if (caseData?.doctor_id !== user.id) {
        return NextResponse.json({ ok: false, message: 'Non autorizzato per questa pratica' }, { status: 403 })
      }
    }

    // Update the medical certificate
    const { data, error } = await (supabase as any)
      .from('medical_certificates')
      .update({
        certificate_type,
        certificate_number,
        certificate_series,
        doctor_name,
        doctor_tax_code,
        doctor_phone,
        doctor_email,
        doctor_address,
        doctor_structure,
        asl_code,
        diagnosis,
        icd_code,
        clinical_findings,
        functional_limitations,
        prognosis,
        therapy_prescribed,
        issue_date,
        expiry_date,
        visit_date,
        digital_signature_present,
        signature_date,
        is_valid,
        verification_status,
        verification_notes,
      })
      .eq('id', certificateId)
      .select()
      .single()

    if (error) {
      console.error('Error updating medical certificate:', error)
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
    }

    revalidatePath('/invalidita-civile')
    revalidatePath(`/invalidita-civile/${existingCert.case_id}`)

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    console.error('Error in PATCH /api/invalidita/certificate:', error)
    return NextResponse.json({ ok: false, message: 'Errore interno del server' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ ok: false, message: 'Non autorizzato' }, { status: 401 })
    }

    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const typedProfile = profile as { role: string } | null

    if (!typedProfile || typedProfile.role !== 'admin') {
      return NextResponse.json({ ok: false, message: 'Solo gli admin possono eliminare certificati' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const certificateId = searchParams.get('id')

    if (!certificateId) {
      return NextResponse.json({ ok: false, message: 'ID certificato non fornito' }, { status: 400 })
    }

    const { error } = await supabase
      .from('medical_certificates')
      .delete()
      .eq('id', certificateId)

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error in DELETE /api/invalidita/certificate:', error)
    return NextResponse.json({ ok: false, message: 'Errore interno del server' }, { status: 500 })
  }
}