import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const formData = await request.formData()
    const caseId = formData.get('caseId') as string

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

    if (!typedProfile || !['admin', 'operator'].includes(typedProfile.role)) {
      return NextResponse.json({ ok: false, message: 'Non autorizzato ad eliminare pratiche' }, { status: 403 })
    }

    // Delete the case (cascade will delete invalidity_details and medical_certificates)
    const { error } = await supabase
      .from('cases')
      .delete()
      .eq('id', caseId)

    if (error) {
      console.error('Error deleting case:', error)
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
    }

    revalidatePath('/invalidita-civile')

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error in DELETE /api/invalidita/delete:', error)
    return NextResponse.json({ ok: false, message: 'Errore interno del server' }, { status: 500 })
  }
}