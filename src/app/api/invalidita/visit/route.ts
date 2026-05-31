/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const supabaseClient = supabase as any
    const formData = await request.formData()
    
    const caseId = formData.get('caseId') as string
    const inps_visit_date = formData.get('inps_visit_date') as string | null
    const inps_visit_result = formData.get('inps_visit_result') as string | null
    const inps_protocol_number = formData.get('inps_protocol_number') as string | null
    const medical_examiner_id = formData.get('medical_examiner_id') as string | null

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

    if (!['admin', 'operator', 'doctor'].includes(profile.role)) {
      return NextResponse.json({ ok: false, message: 'Non autorizzato' }, { status: 403 })
    }

    // Admin/operator: ensure the target case belongs to the same organization
    // before attaching sensitive health data.
    if (profile.role !== 'doctor') {
      const { data: caseOrgRaw } = await supabaseClient
        .from('cases')
        .select('organization_id')
        .eq('id', caseId)
        .single()

      const caseOrg = caseOrgRaw as { organization_id: string | null } | null
      if (!caseOrg || caseOrg.organization_id !== profile.organization_id) {
        return NextResponse.json({ ok: false, message: 'Non autorizzato per questa pratica' }, { status: 403 })
      }
    }

    // Get existing invalidity_details
    const { data: existingDetails } = await supabase
      .from('invalidity_details')
      .select('id')
      .eq('case_id', caseId)
      .single()

    if (existingDetails) {
      return NextResponse.json({ ok: false, message: 'Dettagli già esistenti. Usa PATCH per aggiornare.' }, { status: 400 })
    }

    // Create invalidity_details with visit info
    const { data: insertData, error } = await supabaseClient
      .from('invalidity_details')
      .insert({
        case_id: caseId,
        disability_type: 'da_definire',
        disability_percentage: 0,
        inps_visit_date: inps_visit_date || null,
        inps_visit_result: inps_visit_result || null,
        inps_protocol_number: inps_protocol_number || null,
        medical_examiner_id: medical_examiner_id || (profile.role === 'doctor' ? user.id : null),
        assessment_status: 'in_corso',
        ap70_filed: false,
      })
      .select()
      .single()

    const data = insertData as any

    if (error) {
      console.error('Error creating visit schedule:', error)
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
    }

    revalidatePath('/invalidita-civile')
    revalidatePath(`/invalidita-civile/${caseId}`)

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    console.error('Error in POST /api/invalidita/visit:', error)
    return NextResponse.json({ ok: false, message: 'Errore interno del server' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const supabaseClient = supabase as any
    const formData = await request.formData()
    
    const caseId = formData.get('caseId') as string
    const inps_visit_date = formData.get('inps_visit_date') as string | null
    const inps_visit_result = formData.get('inps_visit_result') as string | null
    const inps_protocol_number = formData.get('inps_protocol_number') as string | null
    const medical_examiner_id = formData.get('medical_examiner_id') as string | null

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

    if (!['admin', 'operator', 'doctor'].includes(profile.role)) {
      return NextResponse.json({ ok: false, message: 'Non autorizzato' }, { status: 403 })
    }

    // Admin/operator: ensure the target case belongs to the same organization.
    if (profile.role !== 'doctor') {
      const { data: caseOrgRaw } = await supabaseClient
        .from('cases')
        .select('organization_id')
        .eq('id', caseId)
        .single()

      const caseOrg = caseOrgRaw as { organization_id: string | null } | null
      if (!caseOrg || caseOrg.organization_id !== profile.organization_id) {
        return NextResponse.json({ ok: false, message: 'Non autorizzato per questa pratica' }, { status: 403 })
      }
    }

    // If doctor, verify they're a collaborator on this case (source of truth)
    if (profile.role === 'doctor') {
      const { data: membership } = await supabaseClient
        .from('case_collaborators')
        .select('id')
        .eq('case_id', caseId)
        .eq('user_id', user.id)
        .eq('role', 'doctor')
        .maybeSingle()

      if (!membership) {
        return NextResponse.json({ ok: false, message: 'Non autorizzato per questa pratica' }, { status: 403 })
      }
    }

    const { data: updateData, error } = await supabaseClient
      .from('invalidity_details')
      .update({
        inps_visit_date: inps_visit_date || null,
        inps_visit_result: inps_visit_result || null,
        inps_protocol_number: inps_protocol_number || null,
        medical_examiner_id: medical_examiner_id || null,
      })
      .eq('case_id', caseId)
      .select()
      .single()

    const data = updateData as any

    if (error) {
      console.error('Error updating visit schedule:', error)
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
    }

    revalidatePath('/invalidita-civile')
    revalidatePath(`/invalidita-civile/${caseId}`)

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    console.error('Error in PATCH /api/invalidita/visit:', error)
    return NextResponse.json({ ok: false, message: 'Errore interno del server' }, { status: 500 })
  }
}