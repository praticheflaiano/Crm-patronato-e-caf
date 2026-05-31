/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const formData = await request.formData()
    
    const caseId = formData.get('caseId') as string
    const disability_type = formData.get('disability_type') as string
    const disability_percentage = parseInt(formData.get('disability_percentage') as string) || 0
    const disability_details = formData.get('disability_details') as string | null
    const inps_visit_date = formData.get('inps_visit_date') as string | null
    const inps_visit_result = formData.get('inps_visit_result') as string | null
    const inps_protocol_number = formData.get('inps_protocol_number') as string | null
    const certification_date = formData.get('certification_date') as string | null
    const certification_expiry_date = formData.get('certification_expiry_date') as string | null
    const benefits_requested = JSON.parse(formData.get('benefits_requested') as string || '[]')
    const benefits_approved = JSON.parse(formData.get('benefits_approved') as string || '[]')
    const assessment_status = formData.get('assessment_status') as string
    const ap70_filed = formData.get('ap70_filed') === 'true'
    const ap70_filing_date = formData.get('ap70_filing_date') as string | null
    const ap70_protocol_number = formData.get('ap70_protocol_number') as string | null

    // Get user's profile to check role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ ok: false, message: 'Non autorizzato' }, { status: 401 })
    }

    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    const typedProfile = profile as { role: string; organization_id: string } | null

    if (!typedProfile) {
      return NextResponse.json({ ok: false, message: 'Profilo non trovato' }, { status: 404 })
    }

    // Only admin, operator, or doctor can create invalidity details
    if (!['admin', 'operator', 'doctor'].includes(typedProfile.role)) {
      return NextResponse.json({ ok: false, message: 'Non autorizzato a gestire dettagli invalidità' }, { status: 403 })
    }

    // Check if invalidity_details already exists for this case
    const { data: existingDetails } = await (supabase as any)
      .from('invalidity_details')
      .select('id')
      .eq('case_id', caseId)
      .single()

    if (existingDetails) {
      return NextResponse.json({ ok: false, message: 'Dettagli già esistenti per questa pratica. Usa PUT per aggiornare.' }, { status: 400 })
    }

    // Create the invalidity details
    const { data, error } = await (supabase as any)
      .from('invalidity_details')
      .insert({
        case_id: caseId,
        disability_type,
        disability_percentage,
        disability_details,
        inps_visit_date: inps_visit_date || null,
        inps_visit_result: inps_visit_result || null,
        inps_protocol_number: inps_protocol_number || null,
        certification_date: certification_date || null,
        certification_expiry_date: certification_expiry_date || null,
        benefits_requested,
        benefits_approved,
        assessment_status,
        ap70_filed,
        ap70_filing_date: ap70_filing_date || null,
        ap70_protocol_number: ap70_protocol_number || null,
        medical_examiner_id: typedProfile.role === 'doctor' ? user.id : null,
        organization_id: typedProfile.organization_id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating invalidity details:', error)
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
    }

    revalidatePath('/invalidita-civile')
    revalidatePath(`/invalidita-civile/${caseId}`)

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    console.error('Error in POST /api/invalidita/details:', error)
    return NextResponse.json({ ok: false, message: 'Errore interno del server' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const formData = await request.formData()
    
    const caseId = formData.get('caseId') as string
    const disability_type = formData.get('disability_type') as string
    const disability_percentage = parseInt(formData.get('disability_percentage') as string) || 0
    const disability_details = formData.get('disability_details') as string | null
    const inps_visit_date = formData.get('inps_visit_date') as string | null
    const inps_visit_result = formData.get('inps_visit_result') as string | null
    const inps_protocol_number = formData.get('inps_protocol_number') as string | null
    const certification_date = formData.get('certification_date') as string | null
    const certification_expiry_date = formData.get('certification_expiry_date') as string | null
    const benefits_requested = JSON.parse(formData.get('benefits_requested') as string || '[]')
    const benefits_approved = JSON.parse(formData.get('benefits_approved') as string || '[]')
    const assessment_status = formData.get('assessment_status') as string
    const ap70_filed = formData.get('ap70_filed') === 'true'
    const ap70_filing_date = formData.get('ap70_filing_date') as string | null
    const ap70_protocol_number = formData.get('ap70_protocol_number') as string | null

    // Get user's profile to check role
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

    if (!typedProfile) {
      return NextResponse.json({ ok: false, message: 'Profilo non trovato' }, { status: 404 })
    }

    // Only admin, operator, or doctor can update invalidity details
    if (!['admin', 'operator', 'doctor'].includes(typedProfile.role)) {
      return NextResponse.json({ ok: false, message: 'Non autorizzato a gestire dettagli invalidità' }, { status: 403 })
    }

    // Get existing details to verify ownership if doctor
    const { data: existingDetails } = await (supabase as any)
      .from('invalidity_details')
      .select('id, case_id')
      .eq('case_id', caseId)
      .single()

    if (!existingDetails) {
      return NextResponse.json({ ok: false, message: 'Dettagli non trovati' }, { status: 404 })
    }

    // Check if the case is assigned to this doctor
    if (typedProfile.role === 'doctor') {
      const { data: caseDataRaw } = await (supabase as any)
        .from('cases')
        .select('doctor_id')
        .eq('id', caseId)
        .single()

      const caseData = caseDataRaw as { doctor_id: string | null } | null

      if (caseData?.doctor_id !== user.id) {
        return NextResponse.json({ ok: false, message: 'Non autorizzato per questa pratica' }, { status: 403 })
      }
    }

    // Update the invalidity details
    const { data, error } = await (supabase as any)
      .from('invalidity_details')
      .update({
        disability_type,
        disability_percentage,
        disability_details,
        inps_visit_date: inps_visit_date || null,
        inps_visit_result: inps_visit_result || null,
        inps_protocol_number: inps_protocol_number || null,
        certification_date: certification_date || null,
        certification_expiry_date: certification_expiry_date || null,
        benefits_requested,
        benefits_approved,
        assessment_status,
        ap70_filed,
        ap70_filing_date: ap70_filing_date || null,
        ap70_protocol_number: ap70_protocol_number || null,
      })
      .eq('case_id', caseId)
      .select()
      .single()

    if (error) {
      console.error('Error updating invalidity details:', error)
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
    }

    revalidatePath('/invalidita-civile')
    revalidatePath(`/invalidita-civile/${caseId}`)

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    console.error('Error in PATCH /api/invalidita/details:', error)
    return NextResponse.json({ ok: false, message: 'Errore interno del server' }, { status: 500 })
  }
}