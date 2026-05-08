import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuthWithRole } from '@/lib/admin-auth-role'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkAdminAuthWithRole()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { full_name_kkd, kki_member_id, director_leader, whatsapp, email } = body

  if (!full_name_kkd || !kki_member_id) {
    return NextResponse.json({ error: 'Nama dan ID Member KKI wajib diisi' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from('affiliates')
    .update({ full_name_kkd, kki_member_id, director_leader, whatsapp, email })
    .eq('id', id)

  if (error) {
    console.error('[affiliate/edit] error:', error)
    return NextResponse.json({ error: 'Gagal memperbarui data affiliate' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
