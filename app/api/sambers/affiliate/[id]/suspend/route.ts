import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuthWithRole } from '@/lib/admin-auth-role'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { notifyAffiliateSuspended } from '@/lib/affiliate/notifications'

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
  const reason = (body.reason as string | undefined) ?? ''

  if (!reason.trim()) {
    return NextResponse.json({ error: 'Alasan suspensi wajib diisi' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  const { data: affiliate, error: fetchErr } = await admin
    .from('affiliates')
    .select('id, status')
    .eq('id', id)
    .single()

  if (fetchErr || !affiliate) {
    return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 })
  }

  if (affiliate.status !== 'approved') {
    return NextResponse.json({ error: 'Affiliate is not in approved status' }, { status: 400 })
  }

  const { error: updateErr } = await admin
    .from('affiliates')
    .update({
      status: 'suspended',
      suspended_reason: reason,
      suspended_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (updateErr) {
    console.error('[suspend affiliate]', updateErr.message)
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  // Disable short links
  await admin
    .from('short_links')
    .update({ status: 'disabled' })
    .eq('affiliate_id', id)

  // Send WA + email + in-app notification (non-critical)
  notifyAffiliateSuspended(id, reason).catch(console.error)

  return NextResponse.json({ success: true })
}
