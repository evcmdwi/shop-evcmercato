import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuthWithRole } from '@/lib/admin-auth-role'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkAdminAuthWithRole()
  if (!auth.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })
  }
  if (auth.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden: super_admin only' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const notes = (body.notes_for_user as string | undefined) ?? ''

  if (!notes.trim()) {
    return NextResponse.json({ error: 'Alasan penolakan wajib diisi' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  const { data: affiliate, error: fetchErr } = await admin
    .from('affiliates')
    .select('id, user_id, status')
    .eq('id', id)
    .single()

  if (fetchErr || !affiliate) {
    return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 })
  }

  if (affiliate.status !== 'pending') {
    return NextResponse.json({ error: 'Application is not in pending status' }, { status: 400 })
  }

  const { error: updateErr } = await admin
    .from('affiliates')
    .update({
      status: 'rejected',
      rejected_reason: notes,
    })
    .eq('id', id)

  if (updateErr) {
    console.error('[reject affiliate]', updateErr.message)
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  // Notify user
  await admin.from('notifications').insert({
    user_id: affiliate.user_id,
    type: 'affiliate_rejected',
    title: 'Pengajuan Affiliate Ditolak',
    body: `Maaf, pengajuan affiliate Anda ditolak. Alasan: ${notes}`,
    metadata: { reason: notes },
  })

  return NextResponse.json({ success: true })
}
